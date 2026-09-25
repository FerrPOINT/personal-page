import type { ArticleDefinition } from '../types';

export const ARTICLE_DEFINITIONS = [
  {
    "slug": "multi-agent-production",
    "order": 1,
    "category": "ai-architecture",
    "locales": {
      "ru": {
        "title": "Мультиагентный AI в промышленной эксплуатации: уроки оркестрации 10+ агентов LangGraph",
        "date": "Дек 2025",
        "readTime": "~5 мин",
        "excerpt": "Практический опыт создания промышленной мультиагентной системы с LangGraph, интеграцией RAG и масштабируемым управлением состоянием."
      },
      "en": {
        "title": "Production-Ready Multi-Agent AI: Lessons from Orchestrating 10+ LangGraph Agents",
        "date": "Dec 2025",
        "readTime": "~5 min",
        "excerpt": "Real-world insights from building a production multi-agent system with LangGraph, RAG integration, and state management at scale."
      }
    }
  },
  {
    "slug": "extreme-scale-adtech",
    "order": 2,
    "category": "high-load",
    "locales": {
      "ru": {
        "title": "Достижение 1M+ RPS: архитектурные подходы для высоконагруженных AdTech-систем",
        "date": "Дек 2025",
        "readTime": "~5 мин",
        "excerpt": "Разбор OpenRTB-сервиса реального времени, обрабатывающего 1 миллион запросов в секунду: оптимизация Aerospike, производительность gRPC и настройка JVM."
      },
      "en": {
        "title": "Achieving 1M+ RPS: Architecture Patterns for Extreme-Scale AdTech Systems",
        "date": "Dec 2025",
        "readTime": "~5 min",
        "excerpt": "Deep dive into building a real-time OpenRTB bidder processing 1 million requests per second: Aerospike optimization, gRPC performance, and JVM tuning."
      }
    }
  },
  {
    "slug": "gost-fintech",
    "order": 3,
    "category": "security",
    "locales": {
      "ru": {
        "title": "ГОСТ-криптография в современном FinTech: событийная архитектура для высоконагруженных цифровых подписей",
        "date": "Дек 2025",
        "readTime": "~5 мин",
        "excerpt": "Реализация алгоритмов ГОСТ в облачных микросервисах: развёртывание в Kubernetes, потоковая обработка событий Kafka и работа с отчётными пиками нагрузки."
      },
      "en": {
        "title": "GOST Cryptography in Modern FinTech: Event-Driven Architecture for High-Load Digital Signatures",
        "date": "Dec 2025",
        "readTime": "~5 min",
        "excerpt": "Implementing GOST algorithms in cloud-native microservices: Kubernetes deployment, Kafka event streaming, and handling reporting-period load spikes."
      }
    }
  }
] satisfies readonly ArticleDefinition[];
