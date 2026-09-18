import type { ArticleDefinition, ExperienceDefinition, ProjectDefinition, SkillDefinition } from './types';
import multiAgent800Avif from '../assets/projects/multi-agent-ai-800.avif';
import multiAgent1600Avif from '../assets/projects/multi-agent-ai-1600.avif';
import multiAgent800Webp from '../assets/projects/multi-agent-ai-800.webp';
import multiAgent1600Webp from '../assets/projects/multi-agent-ai-1600.webp';
import analyticsAgent800Avif from '../assets/projects/analytics-agent-800.avif';
import analyticsAgent1600Avif from '../assets/projects/analytics-agent-1600.avif';
import analyticsAgent800Webp from '../assets/projects/analytics-agent-800.webp';
import analyticsAgent1600Webp from '../assets/projects/analytics-agent-1600.webp';
import adtech800Avif from '../assets/projects/adtech-bidder-800.avif';
import adtech1600Avif from '../assets/projects/adtech-bidder-1600.avif';
import adtech800Webp from '../assets/projects/adtech-bidder-800.webp';
import adtech1600Webp from '../assets/projects/adtech-bidder-1600.webp';
import hr800Avif from '../assets/projects/hr-platform-800.avif';
import hr1600Avif from '../assets/projects/hr-platform-1600.avif';
import hr800Webp from '../assets/projects/hr-platform-800.webp';
import hr1600Webp from '../assets/projects/hr-platform-1600.webp';
import fintech800Avif from '../assets/projects/fintech-crypto-800.avif';
import fintech1600Avif from '../assets/projects/fintech-crypto-1600.avif';
import fintech800Webp from '../assets/projects/fintech-crypto-800.webp';
import fintech1600Webp from '../assets/projects/fintech-crypto-1600.webp';
import pdlc800Avif from '../assets/projects/pdlc-platform-800.avif';
import pdlc1600Avif from '../assets/projects/pdlc-platform-1600.avif';
import pdlc800Webp from '../assets/projects/pdlc-platform-800.webp';
import pdlc1600Webp from '../assets/projects/pdlc-platform-1600.webp';

export const PROJECT_DEFINITIONS = [
  {
    "slug": "multi-agent-ai",
    "order": 1,
    "categories": [
      "ai",
      "devops",
      "fullstack"
    ],
    "stack": [
      "Python",
      "LangChain",
      "Docker",
      "ChromaDB",
      "Telegram API",
      "Google APIs"
    ],
    "media": [
      {
        "kind": "cover",
        "avif": {
          "small": multiAgent800Avif,
          "large": multiAgent1600Avif
        },
        "webp": {
          "small": multiAgent800Webp,
          "large": multiAgent1600Webp
        },
        "alt": {
          "ru": "Консоль запуска AI-агентов с графом оркестрации и трассировкой выполнения",
          "en": "AI agent operations console with an orchestration graph and execution trace"
        }
      }
    ],
    "locales": {
      "ru": {
        "title": "Multi-Agent AI система",
        "role": "Architect / DevOps",
        "summary": "Оркестрация 10+ автономных AI агентов с инфраструктурой RAG.",
        "context": "Спроектировал и оптимизировал сложную multi-agent систему с использованием LangChain и LangGraph. Система оркестрирует более 10 специализированных агентов для обработки разнообразных задач с сохранением контекста. Интегрировал систему RAG (Retrieval-Augmented Generation) с использованием ChromaDB для снижения галлюцинаций и повышения релевантности. Отвечал за полный MLOps пайплайн, включая контейнеризацию агентов и масштабирование векторных баз данных.",
        "contribution": [
          "Спроектировал граф оркестрации и разделил обязанности между 10+ специализированными агентами.",
          "Интегрировал RAG на ChromaDB и сохранение контекста между этапами.",
          "Контейнеризировал AI-сервисы и подготовил воспроизводимый контур развёртывания."
        ],
        "challenges": [
          "Оркестрация 10+ stateful агентов со сложной логикой межкоммуникации.",
          "Реализация RAG для больших неструктурированных датасетов с низкой задержкой.",
          "Развертывание Python-based AI сервисов вместе с Java микросервисами."
        ],
        "decisions": [
          "Централизованное состояние LangGraph вместо прямых связей между агентами.",
          "Получение релевантного контекста через RAG до генерации ответа.",
          "Раздельное масштабирование AI-сервисов и векторного хранилища."
        ],
        "results": [
          "Достигнута стабильная оркестрация 10+ параллельных агентов.",
          "Снижены показатели галлюцинаций за счет интеграции RAG с ChromaDB.",
          "Создан надежный Docker-based пайплайн развертывания для AI сервисов."
        ],
        "metrics": [
          {
            "value": "10+ Agents"
          },
          {
            "value": "RAG Integration"
          },
          {
            "value": "LangGraph"
          }
        ]
      },
      "en": {
        "title": "Multi-Agent AI System",
        "role": "Architect / DevOps",
        "summary": "Orchestration of 10+ autonomous AI agents with RAG infrastructure.",
        "context": "Designed and optimized a complex multi-agent system using LangChain and LangGraph. The system orchestrates over 10 specialized agents to handle diverse tasks with context preservation. Integrated a RAG (Retrieval-Augmented Generation) system using ChromaDB to reduce hallucinations and improve relevance. Responsible for the full MLOps pipeline, including containerization of agents and scaling vector databases.",
        "contribution": [
          "Designed the orchestration graph and separated responsibilities across 10+ specialized agents.",
          "Integrated ChromaDB-backed RAG and context persistence between workflow stages.",
          "Containerized the AI services and prepared a reproducible deployment path."
        ],
        "challenges": [
          "Orchestrating 10+ stateful agents with complex inter-communication logic.",
          "Implementing RAG for large unstructured datasets with low latency.",
          "Deploying Python-based AI services alongside Java microservices."
        ],
        "decisions": [
          "Centralized LangGraph state instead of direct agent-to-agent coupling.",
          "Retrieve relevant context through RAG before response generation.",
          "Scale AI services and vector storage independently."
        ],
        "results": [
          "Achieved stable orchestration of 10+ concurrent agents.",
          "Reduced hallucination rates by integrating RAG with ChromaDB.",
          "Established a robust Docker-based deployment pipeline for AI services."
        ],
        "metrics": [
          {
            "value": "10+ Agents"
          },
          {
            "value": "RAG Integration"
          },
          {
            "value": "LangGraph"
          }
        ]
      }
    }
  },
  {
    "slug": "analytics-agent",
    "order": 2,
    "categories": [
      "ai",
      "devops",
      "fullstack"
    ],
    "stack": [
      "Python",
      "FastAPI",
      "LangGraph",
      "PostgreSQL",
      "SQLAlchemy",
      "sqlglot",
      "Plotly",
      "Redis",
      "Langfuse"
    ],
    "media": [
      {
        "kind": "cover",
        "avif": {
          "small": analyticsAgent800Avif,
          "large": analyticsAgent1600Avif
        },
        "webp": {
          "small": analyticsAgent800Webp,
          "large": analyticsAgent1600Webp
        },
        "alt": {
          "ru": "Диалог с аналитическим AI-агентом, который отвечает встроенными графиками и таблицами",
          "en": "Analytics AI agent conversation with charts and tables embedded in assistant responses"
        },
        "caption": {
          "ru": "Обезличенный макет интерфейса на синтетических данных.",
          "en": "An anonymized interface mockup using synthetic data."
        }
      }
    ],
    "locales": {
      "ru": {
        "title": "Аналитический AI-агент",
        "role": "Architect / AI Backend",
        "summary": "Ассистент превращает вопросы на естественном языке в проверяемые таблицы, графики и выгрузки.",
        "context": "Спроектировал внутреннюю аналитическую платформу, в которой пользователь выбирает рабочую область и задаёт вопрос на естественном языке. Runtime строит типизированный план, разрешает метрики, периоды и фильтры, детерминированно формирует SQL, проверяет его через SQLPolicy и создаёт текст, таблицу и Plotly-график из одного валидированного результата.",
        "contribution": [
          "Спроектировал основной путь от пользовательского вопроса и project routing до проверенного результата.",
          "Разделил ответственность LLM и runtime: модель формирует типизированный контракт анализа, а исполняемый SQL строится только детерминированным кодом.",
          "Развивал диалоговый контекст, streaming-ответы, визуализацию, экспорт и наблюдаемость аналитического контура."
        ],
        "challenges": [
          "Не допустить исполнения произвольного или придуманного моделью SQL.",
          "Сохранять смысл связанных follow-up вопросов без переноса нерелевантных фильтров между анализами.",
          "Гарантировать согласованность текста, таблицы и графика с фактическим результатом запроса."
        ],
        "decisions": [
          "LLM возвращает AnalyticsRequest или ограниченный AnalysisPlan вместо исполняемого SQL.",
          "Детерминированный SQL builder, bind parameters и единая AST-проверка SQLPolicy образуют безопасную границу данных.",
          "Один валидированный ResultContract используется для текста, таблицы, графика и повторного экспорта."
        ],
        "results": [
          "Создан единый аналитический контур для нескольких проектных БД без прямой генерации SQL моделью.",
          "Поддержаны scoped-диалоги, последовательный анализ, Plotly-визуализации и экспорт CSV/XLSX/PNG.",
          "Ошибки зависимостей, отсутствие данных и необходимость уточнения представлены явными безопасными outcomes."
        ],
        "metrics": [
          {
            "value": "Typed IR"
          },
          {
            "value": "SQLPolicy"
          },
          {
            "value": "CSV/XLSX/PNG"
          }
        ]
      },
      "en": {
        "title": "Analytics AI Agent",
        "role": "Architect / AI Backend",
        "summary": "An assistant that turns natural-language questions into verifiable tables, charts, and exports.",
        "context": "Designed an internal analytics platform where users select a workspace and ask questions in natural language. The runtime builds a typed plan, resolves metrics, periods, and filters, generates SQL deterministically, validates it through SQLPolicy, and produces text, a table, and a Plotly chart from one validated result.",
        "contribution": [
          "Designed the main path from user question and project routing to a validated result.",
          "Separated LLM and runtime responsibilities: the model produces a typed analytics contract while executable SQL is built only by deterministic code.",
          "Evolved conversational context, streamed responses, visualization, exports, and analytics observability."
        ],
        "challenges": [
          "Preventing execution of arbitrary or model-invented SQL.",
          "Preserving the meaning of related follow-up questions without leaking irrelevant filters between analyses.",
          "Keeping narrative, table, and chart output grounded in the actual query result."
        ],
        "decisions": [
          "The LLM returns an AnalyticsRequest or bounded AnalysisPlan instead of executable SQL.",
          "A deterministic SQL builder, bind parameters, and a single SQLPolicy AST check form the safe data boundary.",
          "One validated ResultContract drives narrative, table, chart, and repeatable exports."
        ],
        "results": [
          "Established one analytics path across multiple project databases without direct model-generated SQL.",
          "Delivered scoped conversations, sequential analysis, Plotly visualizations, and CSV/XLSX/PNG exports.",
          "Dependency failures, no-data cases, and clarification needs are represented as explicit safe outcomes."
        ],
        "metrics": [
          {
            "value": "Typed IR"
          },
          {
            "value": "SQLPolicy"
          },
          {
            "value": "CSV/XLSX/PNG"
          }
        ]
      }
    }
  },
  {
    "slug": "adtech-bidder",
    "order": 3,
    "categories": [
      "ai",
      "devops",
      "fullstack"
    ],
    "stack": [
      "Java",
      "Spring Boot",
      "AWS",
      "Aerospike",
      "React",
      "gRPC",
      "MySQL"
    ],
    "media": [
      {
        "kind": "cover",
        "avif": {
          "small": adtech800Avif,
          "large": adtech1600Avif
        },
        "webp": {
          "small": adtech800Webp,
          "large": adtech1600Webp
        },
        "alt": {
          "ru": "Консоль OpenRTB-аукциона с лимитом 100 мс, тепловой картой ставок и live tape",
          "en": "OpenRTB auction console with a 100 ms deadline, bid heatmap, and live tape"
        }
      }
    ],
    "locales": {
      "ru": {
        "title": "Высоконагруженный AdTech Bidder",
        "role": "FullStack / SRE",
        "summary": "Система реального времени для биддинга, обрабатывающая 1 миллион+ RPS на AWS.",
        "context": "Разработал высокопроизводительный OpenRTB bidder, способный обрабатывать ~1 миллион запросов в секунду. Проект включал Full-Stack разработку (CRM UI + Backend) и глубокую DevOps работу на AWS. Реализовал сервисы предиктивного моделирования и оптимизировал сетевой стек для экстремальной пропускной способности. Мигрировал горячие данные в Aerospike для субмиллисекундного доступа.",
        "contribution": [
          "Разрабатывал bidder, backend-сервисы и CRM-интерфейс управления кампаниями.",
          "Оптимизировал JVM, сетевой стек и путь доступа к горячим данным.",
          "Автоматизировал инфраструктуру и развёртывание в AWS."
        ],
        "challenges": [
          "Обработка 1M+ RPS в строгих 100ms таймаутах OpenRTB.",
          "Оптимизация Java GC и параметров ядра для высокой пропускной способности.",
          "Создание удобного CRM для управления кампаниями."
        ],
        "decisions": [
          "Aerospike для горячих данных с субмиллисекундным доступом.",
          "gRPC для компактного внутреннего обмена и меньшей задержки.",
          "Асинхронная обработка и настройка JVM для контроля хвостовой latency."
        ],
        "results": [
          "Подтверждена стабильная обработка целевой нагрузки около 1M RPS.",
          "Успешная миграция на Aerospike с уменьшением задержки чтения.",
          "Комплексная автоматизация AWS инфраструктуры."
        ],
        "metrics": [
          {
            "value": "1M+ RPS"
          },
          {
            "value": "AWS"
          },
          {
            "value": "Aerospike"
          }
        ]
      },
      "en": {
        "title": "High-Load AdTech Bidder",
        "role": "FullStack / SRE",
        "summary": "Real-time bidding system processing 1 Million+ RPS on AWS.",
        "context": "Developed a high-performance OpenRTB bidder capable of handling ~1 million requests per second. The project involved Full-Stack development (CRM UI + Backend) and deep DevOps work on AWS. Implemented predictive modeling services and optimized the network stack for extreme throughput. Migrated hot data to Aerospike for sub-millisecond access.",
        "contribution": [
          "Developed the bidder, backend services, and campaign-management CRM.",
          "Optimized the JVM, network stack, and hot-data access path.",
          "Automated infrastructure and deployment on AWS."
        ],
        "challenges": [
          "Processing 1M+ RPS within strict 100ms OpenRTB timeouts.",
          "Optimizing Java GC and kernel parameters for high throughput.",
          "Building a user-friendly CRM for campaign management."
        ],
        "decisions": [
          "Aerospike for hot data with sub-millisecond access.",
          "gRPC for compact internal communication and lower latency.",
          "Asynchronous processing and JVM tuning to control tail latency."
        ],
        "results": [
          "Validated stable processing at the target load of about 1M RPS.",
          "Successful migration to Aerospike reducing read latency.",
          "Comprehensive AWS infrastructure automation."
        ],
        "metrics": [
          {
            "value": "1M+ RPS"
          },
          {
            "value": "AWS"
          },
          {
            "value": "Aerospike"
          }
        ]
      }
    }
  },
  {
    "slug": "hr-platform",
    "order": 4,
    "categories": [
      "ai",
      "devops",
      "fullstack"
    ],
    "stack": [
      "Java",
      "Spring Boot",
      "React",
      "TypeScript",
      "GitLab CI",
      "Docker",
      "PostgreSQL",
      "ML/AI"
    ],
    "media": [
      {
        "kind": "cover",
        "avif": {
          "small": hr800Avif,
          "large": hr1600Avif
        },
        "webp": {
          "small": hr800Webp,
          "large": hr1600Webp
        },
        "alt": {
          "ru": "Светлая ATS-доска с воронкой кандидатов, AI matching и расписанием интервью",
          "en": "Light ATS board with a candidate pipeline, AI matching, and interview schedule"
        }
      }
    ],
    "locales": {
      "ru": {
        "title": "HR платформа для рекрутинга",
        "role": "FullStack / DevOps",
        "summary": "Экосистема полного цикла рекрутинга с 4 модулями и CI/CD пайплайнами.",
        "context": "Построил комплексную HR платформу, состоящую из 4 независимых модулей (Recruiter, Candidate, Logic, AI Matching). Отвечал за Full-Stack разработку (Java/Spring + React/TS) и DevOps пайплайн. Реализовал модуль AI Matching с использованием технологий машинного обучения для интеллектуального сопоставления кандидатов и вакансий, автоматизированные алгоритмы сопоставления на основе ИИ, JWT безопасность между модулями и настроил полный GitLab CI/CD пайплайн для развертывания в development, staging и production окружения.",
        "contribution": [
          "Разработал backend и frontend четырёх связанных модулей платформы.",
          "Реализовал интеллектуальный matching кандидатов и вакансий.",
          "Настроил единый CI/CD-процесс для development, staging и production."
        ],
        "challenges": [
          "Синхронизация 4 независимых модулей с единой системой аутентификации.",
          "Разработка модуля AI Matching с использованием ML для интеллектуального анализа резюме и вакансий.",
          "Создание сложных SQL алгоритмов для сопоставления кандидатов и вакансий в сочетании с ИИ-логикой.",
          "Автоматизация развертывания всего флота микросервисов."
        ],
        "decisions": [
          "Четыре независимых модуля с единым контуром JWT-аутентификации.",
          "Сочетание оптимизированного SQL и ML-логики для matching.",
          "Одинаковый проверяемый pipeline для всех окружений."
        ],
        "results": [
          "Единый автоматизированный CI/CD пайплайн для всех окружений.",
          "Рабочие порталы Recruiter и Candidate с согласованными пользовательскими сценариями.",
          "ИИ-модуль для интеллектуального сопоставления кандидатов и вакансий.",
          "Высокопроизводительная логика сопоставления с использованием нативной SQL оптимизации и ML-алгоритмов."
        ],
        "metrics": [
          {
            "value": "4 Modules"
          },
          {
            "value": "GitLab CI/CD"
          },
          {
            "value": "React + Java"
          }
        ]
      },
      "en": {
        "title": "HR Recruiting Platform",
        "role": "FullStack / DevOps",
        "summary": "Full-cycle recruiting ecosystem with 4 modules and CI/CD pipelines.",
        "context": "Built a comprehensive HR platform consisting of 4 independent modules (Recruiter, Candidate, Logic, AI Matching). Handled the Full-Stack development (Java/Spring + React/TS) and the DevOps pipeline. Implemented the AI Matching module using machine learning technologies for intelligent candidate-vacancy matching, AI-powered automated matching algorithms, JWT security across modules, and set up a complete GitLab CI/CD pipeline deploying to development, staging, and production environments.",
        "contribution": [
          "Developed the backend and frontend across four connected platform modules.",
          "Implemented intelligent candidate-to-vacancy matching.",
          "Established one CI/CD path across development, staging, and production."
        ],
        "challenges": [
          "Synchronizing 4 independent modules with a unified auth system.",
          "Developing AI Matching module using ML for intelligent resume and vacancy analysis.",
          "Creating complex SQL algorithms for candidate-vacancy matching combined with AI logic.",
          "Automating deployment of the entire microservice fleet."
        ],
        "decisions": [
          "Four independent modules with one JWT authentication boundary.",
          "Combine optimized SQL with ML logic for matching.",
          "Use the same verifiable pipeline across environments."
        ],
        "results": [
          "One automated CI/CD pipeline across all environments.",
          "Working Recruiter and Candidate portals with consistent user flows.",
          "AI module for intelligent candidate-to-vacancy matching.",
          "High-performance matching logic using native SQL optimization combined with ML algorithms."
        ],
        "metrics": [
          {
            "value": "4 Modules"
          },
          {
            "value": "GitLab CI/CD"
          },
          {
            "value": "React + Java"
          }
        ]
      }
    }
  },
  {
    "slug": "fintech-crypto",
    "order": 5,
    "categories": [
      "devops",
      "fullstack"
    ],
    "stack": [
      "Java 21",
      "Spring Boot 3",
      "Kubernetes",
      "Kafka",
      "PostgreSQL",
      "Vault"
    ],
    "media": [
      {
        "kind": "cover",
        "avif": {
          "small": fintech800Avif,
          "large": fintech1600Avif
        },
        "webp": {
          "small": fintech800Webp,
          "large": fintech1600Webp
        },
        "alt": {
          "ru": "Банковский кабинет цифровой подписи с документом, HSM, сертификатами и аудитом",
          "en": "Banking digital-signature workspace with document, HSM, certificates, and audit trail"
        }
      }
    ],
    "locales": {
      "ru": {
        "title": "FinTech криптографические сервисы",
        "role": "Backend / Infra",
        "summary": "Безопасные микросервисы для GOST цифровых подписей и сертификатов.",
        "context": "Спроектировал набор микросервисов для банковских криптографических операций. Реализовал алгоритмы GOST для цифровых подписей и шифрования. Система построена с event-driven архитектурой с использованием Kafka для обработки пиков нагрузки в периоды отчетности. DevOps обязанности включали оркестрацию Kubernetes, Helm charting и усиление безопасности.",
        "contribution": [
          "Спроектировал сервисы цифровой подписи и шифрования на алгоритмах ГОСТ.",
          "Отделил криптографические операции в изолированный сервисный контур.",
          "Подготовил Kubernetes-развёртывание и усиление безопасности."
        ],
        "challenges": [
          "Интеграция legacy GOST крипто-библиотек в современные Spring Boot приложения.",
          "Обеспечение соответствия строгим банковским стандартам безопасности.",
          "Асинхронная обработка массивных пиков в запросах на подпись."
        ],
        "decisions": [
          "Асинхронный обмен через Kafka для изоляции пиков нагрузки.",
          "Ключи и секреты вынесены за границу прикладного сервиса.",
          "Горизонтальное масштабирование обработчиков в Kubernetes."
        ],
        "results": [
          "Криптографические операции изолированы в отдельном защищённом контуре.",
          "Масштабируемая K8s архитектура сглаживает отчётные пики нагрузки.",
          "Надежная event-driven обработка через Kafka."
        ],
        "metrics": [
          {
            "value": "GOST Crypto"
          },
          {
            "value": "Kubernetes"
          },
          {
            "value": "Kafka"
          }
        ]
      },
      "en": {
        "title": "FinTech Crypto Services",
        "role": "Backend / Infra",
        "summary": "Secure microservices for GOST digital signatures and certificates.",
        "context": "Designed a suite of microservices for banking-grade cryptographic operations. Implemented GOST algorithms for digital signatures and encryption. The system was built with an event-driven architecture using Kafka to handle load spikes during reporting periods. DevOps responsibilities included Kubernetes orchestration, Helm charting, and security hardening.",
        "contribution": [
          "Designed digital-signature and encryption services based on GOST algorithms.",
          "Isolated cryptographic operations behind a dedicated service boundary.",
          "Prepared Kubernetes deployment and security hardening."
        ],
        "challenges": [
          "Integrating legacy GOST crypto-libraries into modern Spring Boot apps.",
          "Ensuring compliance with strict banking security standards.",
          "Handling massive spikes in signing requests asynchronously."
        ],
        "decisions": [
          "Asynchronous Kafka flow to isolate load spikes.",
          "Keep keys and secrets outside the application service boundary.",
          "Scale processing workers horizontally in Kubernetes."
        ],
        "results": [
          "Cryptographic operations are isolated behind a dedicated security boundary.",
          "Scalable K8s architecture absorbs reporting-period load spikes.",
          "Reliable event-driven processing via Kafka."
        ],
        "metrics": [
          {
            "value": "GOST Crypto"
          },
          {
            "value": "Kubernetes"
          },
          {
            "value": "Kafka"
          }
        ]
      }
    }
  },
  {
    "slug": "pdlc-platform",
    "order": 6,
    "categories": [
      "ai",
      "devops",
      "fullstack"
    ],
    "stack": [
      "Rust",
      "Python",
      "Axum",
      "FastAPI",
      "React 19",
      "PostgreSQL",
      "OpenAPI",
      "Docker"
    ],
    "links": [
      {
        "label": {
          "ru": "Task Tracker",
          "en": "Task Tracker"
        },
        "href": "https://github.com/FerrPOINT/task-tracker"
      },
      {
        "label": {
          "ru": "Project Workflow",
          "en": "Project Workflow"
        },
        "href": "https://github.com/FerrPOINT/project-workflow"
      },
      {
        "label": {
          "ru": "Fleet Control",
          "en": "Fleet Control"
        },
        "href": "https://github.com/FerrPOINT/fleet-control"
      },
      {
        "label": {
          "ru": "Forge CI/CD",
          "en": "Forge CI/CD"
        },
        "href": "https://github.com/FerrPOINT/CI-CD"
      },
      {
        "label": {
          "ru": "Wiki / Evidence",
          "en": "Wiki / Evidence"
        },
        "href": "https://github.com/FerrPOINT/wiki"
      },
      {
        "label": {
          "ru": "Admin Panel",
          "en": "Admin Panel"
        },
        "href": "https://github.com/FerrPOINT/admin-panel"
      }
    ],
    "media": [
      {
        "kind": "cover",
        "avif": {
          "small": pdlc800Avif,
          "large": pdlc1600Avif
        },
        "webp": {
          "small": pdlc800Webp,
          "large": pdlc1600Webp
        },
        "alt": {
          "ru": "Панель управления полным циклом разработки с фазами, workflow, CI, evidence и релизными проверками",
          "en": "Full development lifecycle control center with phases, workflows, CI, evidence, and release checks"
        }
      }
    ],
    "locales": {
      "ru": {
        "title": "PDLC-платформа полного цикла разработки",
        "role": "Architect / FullStack",
        "summary": "Единый контур от планирования задачи и работы AI-агентов до проверяемого релиза и аудита.",
        "context": "Развиваю набор self-hosted сервисов Base Platform, которые закрывают полный цикл разработки продукта. Task Tracker отвечает за проекты, backlog, sprint и kanban; Project Workflow ведёт задачу по фазам с обязательными checks, evidence и supervisor gate; Fleet Control управляет изолированными AI-агентами и их сессиями; Wiki хранит требования, решения и доказательства; Forge CI/CD связывает Git push с pipeline, approvals, artifacts, environments и rollback; Admin Panel управляет каталогом и общими настройками платформы.",
        "contribution": [
          "Спроектировал границы сервисов и единый путь задачи от требования до релиза.",
          "Реализовал рабочие web-интерфейсы, API/CLI-контракты и PostgreSQL-модели для основных контуров платформы.",
          "Связал workflow, выполнение AI-агентами, evidence и релизные проверки через устойчивые идентификаторы и аудит."
        ],
        "challenges": [
          "Сохранить трассируемость между задачей, фазой workflow, агентской сессией, commit, pipeline и evidence.",
          "Изолировать runtime и секреты агентов, сохранив управляемость и наблюдаемость.",
          "Развести источники истины между сервисами без дублирования изменяемого состояния."
        ],
        "decisions": [
          "Task Tracker владеет планированием, Project Workflow — фазами, Fleet Control — runtime агентов, Wiki — знаниями и evidence, Forge — Git и CI/CD.",
          "Append-only история используется для решений supervisor, проверок, approval и аудита.",
          "OpenAPI и CLI образуют стабильную границу для автоматизации и интеграции агентов."
        ],
        "results": [
          "Собран сквозной контур Discover → Plan → Build → Verify → Release → Operate.",
          "Проверки, evidence и решения сохраняются рядом с контекстом задачи и релиза.",
          "Каждый сервис можно развивать и развёртывать независимо, сохраняя общий жизненный цикл."
        ],
        "metrics": [
          {
            "value": "6 Services"
          },
          {
            "value": "End-to-End PDLC"
          },
          {
            "value": "OpenAPI + CLI"
          }
        ]
      },
      "en": {
        "title": "Full-Cycle PDLC Platform",
        "role": "Architect / FullStack",
        "summary": "One governed path from task planning and AI-agent execution to verifiable release and audit.",
        "context": "I am building a set of self-hosted Base Platform services that cover the full product development lifecycle. Task Tracker owns projects, backlog, sprints, and kanban; Project Workflow moves work through phases with mandatory checks, evidence, and a supervisor gate; Fleet Control manages isolated AI agents and sessions; Wiki stores requirements, decisions, and evidence; Forge CI/CD connects Git pushes to pipelines, approvals, artifacts, environments, and rollback; Admin Panel manages the platform catalog and shared settings.",
        "contribution": [
          "Designed service boundaries and one traceable path from requirement to release.",
          "Implemented working web surfaces, API/CLI contracts, and PostgreSQL models across the core platform services.",
          "Connected workflows, AI-agent execution, evidence, and release checks through durable identifiers and audit history."
        ],
        "challenges": [
          "Preserving traceability across a work item, workflow phase, agent session, commit, pipeline, and evidence.",
          "Isolating agent runtimes and secrets while keeping them manageable and observable.",
          "Separating sources of truth across services without duplicating mutable state."
        ],
        "decisions": [
          "Task Tracker owns planning, Project Workflow owns phases, Fleet Control owns agent runtimes, Wiki owns knowledge and evidence, and Forge owns Git and CI/CD.",
          "Append-only history records supervisor decisions, checks, approvals, and audit events.",
          "OpenAPI and CLI contracts provide stable boundaries for automation and agent integration."
        ],
        "results": [
          "Established an end-to-end Discover → Plan → Build → Verify → Release → Operate path.",
          "Checks, evidence, and decisions stay attached to the relevant task and release context.",
          "Each service can evolve and deploy independently while preserving the shared lifecycle."
        ],
        "metrics": [
          {
            "value": "6 Services"
          },
          {
            "value": "End-to-End PDLC"
          },
          {
            "value": "OpenAPI + CLI"
          }
        ]
      }
    }
  }
] satisfies readonly ProjectDefinition[];

export const EXPERIENCE_DEFINITIONS = [
  {
    "id": "independent-products",
    "order": 1,
    "company": "Independent / Freelance",
    "tech": [
      "Java 25",
      "Spring Boot 4",
      "Rust",
      "Python",
      "FastAPI",
      "React",
      "PostgreSQL",
      "Docker"
    ],
    "locales": {
      "ru": {
        "role": "Software Architect / FullStack Engineer",
        "period": "2025 - Настоящее время",
        "description": "Параллельно развиваю собственные open-source и self-hosted продукты и выполняю фриланс-проекты полного цикла: от анализа задачи и архитектуры до реализации, CI/CD и эксплуатации.",
        "focusAreas": [
          "Enterprise-платформы",
          "PDLC / SDLC",
          "AI-агенты",
          "Developer Infrastructure",
          "Full-Cycle Delivery"
        ],
        "achievements": [
          "Создаю экосистему Base Platform: Task Tracker, Project Workflow, Fleet Control, Wiki / Evidence, Forge CI/CD и Admin Panel — единый PDLC / SDLC-контур от задачи и работы AI-агентов до проверяемого релиза.",
          "Разрабатываю Java Agent на Java 25 и Spring Boot: долгоживущие агентные сессии, REST / SSE и OpenAI-compatible API, CLI, инструменты с политиками безопасности, MCP и Telegram gateway.",
          "Проектирую self-hosted enterprise-инструменты с типизированными API-контрактами, аудитом, изоляцией секретов, Docker-развёртыванием и воспроизводимым выпуском.",
          "Выполняю фриланс-задачи по архитектуре, full-stack разработке, AI-интеграциям, CI/CD и развитию существующих систем."
        ]
      },
      "en": {
        "role": "Software Architect / FullStack Engineer",
        "period": "2025 - Present",
        "description": "In parallel, I build my own open-source and self-hosted products and deliver full-cycle freelance projects, from discovery and architecture through implementation, CI/CD, and operations.",
        "focusAreas": [
          "Enterprise Platforms",
          "PDLC / SDLC",
          "AI Agents",
          "Developer Infrastructure",
          "Full-Cycle Delivery"
        ],
        "achievements": [
          "Building the Base Platform ecosystem: Task Tracker, Project Workflow, Fleet Control, Wiki / Evidence, Forge CI/CD, and Admin Panel — one PDLC / SDLC path from a work item and AI-agent execution to a verifiable release.",
          "Developing Java Agent on Java 25 and Spring Boot with long-running agent sessions, REST / SSE and OpenAI-compatible APIs, CLI, policy-governed tools, MCP, and a Telegram gateway.",
          "Designing self-hosted enterprise tools with typed API contracts, auditability, secret isolation, Docker deployment, and reproducible releases.",
          "Delivering freelance work across architecture, full-stack development, AI integrations, CI/CD, and existing-system evolution."
        ]
      }
    }
  },
  {
    "id": "1",
    "order": 2,
    "company": "WMT Group",
    "tech": [
      "Java 21",
      "Spring Boot 3",
      "Python",
      "LangChain",
      "PostgreSQL",
      "React",
      "Kubernetes"
    ],
    "locales": {
      "ru": {
        "role": "Java Developer / Architect",
        "period": "Апр 2022 - Март 2026",
        "description": "Разработка и архитектура портфеля сложных enterprise-систем WMT Group: PDLC-платформы полного цикла, агентные AI-системы, банковские и FinTech-сервисы, HR-продукты. Зоны ответственности — системный дизайн, безопасность, производительность, надёжность и поставка.",
        "focusAreas": [
          "Enterprise-платформы",
          "PDLC / SDLC",
          "Agentic AI",
          "Банки и FinTech",
          "Security & Performance"
        ],
        "achievements": [
          "Спроектировал PDLC-контур полного цикла: управление задачами, фазовые workflow, парк агентов, knowledge/evidence, Git/CI/CD и релизные проверки.",
          "Разрабатывал агентные AI-системы с оркестрацией 10+ автономных агентов, RAG, управлением контекстом и изолированными runtime.",
          "Проектировал защищённые интеграции и криптографические сервисы для банковских проектов, включая цифровые подписи, аудит и работу с чувствительными данными.",
          "Проводил профилирование и оптимизацию Java/Spring-сервисов, SQL и межсервисного взаимодействия, устраняя узкие места под высокой нагрузкой.",
          "Разработал комплексную HR-платформу для рекрутинга с четырьмя независимыми модулями."
        ]
      },
      "en": {
        "role": "Java Developer / Architect",
        "period": "Apr 2022 - Mar 2026",
        "description": "Engineering and architecture across a portfolio of complex WMT Group enterprise systems: full-cycle PDLC platforms, agentic AI systems, banking and FinTech services, and HR products. Responsibilities span system design, security, performance, reliability, and delivery.",
        "focusAreas": [
          "Enterprise Platforms",
          "PDLC / SDLC",
          "Agentic AI",
          "Banking & FinTech",
          "Security & Performance"
        ],
        "achievements": [
          "Designed a full-cycle PDLC spanning task management, phase workflows, agent fleet control, knowledge/evidence, Git/CI/CD, and release gates.",
          "Built agentic AI systems with orchestration of 10+ autonomous agents, RAG, context management, and isolated runtimes.",
          "Designed secure integrations and cryptographic services for banking projects, including digital signatures, audit trails, and sensitive-data handling.",
          "Profiled and optimized Java/Spring services, SQL, and service-to-service communication to remove bottlenecks under high load.",
          "Developed a comprehensive HR recruiting platform with four independent modules."
        ]
      }
    }
  },
  {
    "id": "2",
    "order": 3,
    "company": "Jar Soft",
    "tech": [
      "Java",
      "Spring Boot",
      "AWS",
      "Aerospike",
      "MySQL",
      "gRPC",
      "React",
      "OpenRTB"
    ],
    "locales": {
      "ru": {
        "role": "FullStack Java Software Engineer",
        "period": "Янв 2017 - Фев 2022",
        "description": "Разработал высоконагруженные распределенные серверные системы и AdTech решения, обрабатывающие ~1 миллион RPS.",
        "focusAreas": [
          "Высоконагруженные системы",
          "AdTech / OpenRTB",
          "Распределённые системы",
          "Оптимизация производительности",
          "AWS"
        ],
        "achievements": [
          "Построил систему OpenRTB bidder, обрабатывающую ~1 миллион запросов в секунду.",
          "Спроектировал архитектуру для сервисов предиктивного моделирования на AWS.",
          "Разработал CRM UI и backend сервисы для управления кампаниями.",
          "Настроил Aerospike и JVM для субмиллисекундного времени отклика."
        ]
      },
      "en": {
        "role": "FullStack Java Software Engineer",
        "period": "Jan 2017 - Feb 2022",
        "description": "Developed high-load distributed server systems and AdTech solutions processing ~1 million RPS.",
        "focusAreas": [
          "High-Load Systems",
          "AdTech / OpenRTB",
          "Distributed Systems",
          "Performance Engineering",
          "AWS"
        ],
        "achievements": [
          "Built an OpenRTB bidder system processing ~1 million requests per second.",
          "Designed architecture for predictive modeling services on AWS.",
          "Developed CRM UI and backend services for campaign management.",
          "Tuned Aerospike and JVM for sub-millisecond response times."
        ]
      }
    }
  },
  {
    "id": "3",
    "order": 4,
    "company": "Improve Group",
    "tech": [
      "Java",
      "Frameworks",
      "Enterprise Systems"
    ],
    "locales": {
      "ru": {
        "role": "Software Developer",
        "period": "Авг 2016 - Дек 2016",
        "description": "Развитие и поддержка корпоративных приложений, подбор и внедрение технологий для клиентских проектов.",
        "focusAreas": [
          "Корпоративные приложения",
          "Развитие существующих систем",
          "Внедрение технологий",
          "Поддержка и сопровождение"
        ],
        "achievements": [
          "Быстрое внедрение новых фреймворков и технологий для клиентских проектов.",
          "Модификация и поддержка существующих корпоративных приложений."
        ]
      },
      "en": {
        "role": "Software Developer",
        "period": "Aug 2016 - Dec 2016",
        "description": "Developed and maintained enterprise applications, evaluating and introducing technologies for client projects.",
        "focusAreas": [
          "Enterprise Applications",
          "Existing System Evolution",
          "Technology Adoption",
          "Maintenance and Support"
        ],
        "achievements": [
          "Rapid adoption of new frameworks and technologies for client projects.",
          "Modification and support of existing enterprise applications."
        ]
      }
    }
  },
  {
    "id": "4",
    "order": 5,
    "company": "Academ-Media",
    "tech": [
      "Java",
      "C#",
      "Game Dev",
      "Mobile Optimization"
    ],
    "locales": {
      "ru": {
        "role": "Software Developer",
        "period": "Авг 2015 - Авг 2016",
        "description": "Разработка игр и оптимизация движка для мобильных платформ.",
        "focusAreas": [
          "Разработка игр",
          "Мобильные платформы",
          "Оптимизация движка",
          "C# / UWP"
        ],
        "achievements": [
          "Оптимизировал игровой движок для устройств с ограниченными ресурсами.",
          "Разработал приложения Universal Windows Platform (UWP) на C#."
        ]
      },
      "en": {
        "role": "Software Developer",
        "period": "Aug 2015 - Aug 2016",
        "description": "Game development and engine optimization for mobile platforms.",
        "focusAreas": [
          "Game Development",
          "Mobile Platforms",
          "Engine Optimization",
          "C# / UWP"
        ],
        "achievements": [
          "Optimized game engine for resource-constrained mobile devices.",
          "Developed Universal Windows Platform (UWP) applications in C#."
        ]
      }
    }
  }
] satisfies readonly ExperienceDefinition[];

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
    "id": "react-typescript",
    "order": 5,
    "level": 80,
    "category": "frameworks",
    "name": {
      "ru": "React / TS",
      "en": "React / TS"
    }
  },
  {
    "id": "high-load-aws",
    "order": 6,
    "level": 90,
    "category": "infrastructure",
    "name": {
      "ru": "Высоконагруженные системы / AWS",
      "en": "High-Load / AWS"
    }
  }
] satisfies readonly SkillDefinition[];

export const ARTICLE_DEFINITIONS = [
  {
    "slug": "multi-agent-production",
    "order": 1,
    "category": "ai-architecture",
    "locales": {
      "ru": {
        "title": "Production-Ready Multi-Agent AI: Уроки оркестрации 10+ LangGraph агентов",
        "date": "Дек 2025",
        "readTime": "~5 мин",
        "excerpt": "Практические инсайты из создания production multi-agent системы с LangGraph, интеграцией RAG и управлением состоянием в масштабе."
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
        "title": "Достижение 1M+ RPS: Архитектурные паттерны для экстремально масштабируемых AdTech систем",
        "date": "Дек 2025",
        "readTime": "~5 мин",
        "excerpt": "Глубокое погружение в создание real-time OpenRTB bidder, обрабатывающего 1 миллион запросов в секунду: оптимизация Aerospike, производительность gRPC и настройка JVM."
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
        "title": "GOST криптография в современном FinTech: Event-Driven архитектура для высоконагруженных цифровых подписей",
        "date": "Дек 2025",
        "readTime": "~5 мин",
        "excerpt": "Реализация алгоритмов GOST в cloud-native микросервисах: развертывание Kubernetes, стриминг событий Kafka и обработка отчётных пиков нагрузки."
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

