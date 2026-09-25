import type { ExperienceDefinition } from '../types';

export const EXPERIENCE_DEFINITIONS = [
  {
    "id": "independent-products",
    "order": 1,
    "tech": [
      "Java 25",
      "Spring Boot 4.1",
      "Rust",
      "Python",
      "FastAPI",
      "React",
      "PostgreSQL",
      "Docker"
    ],
    "locales": {
      "ru": {
        "company": "Независимые проекты / Фриланс",
        "role": "Архитектор ПО / FullStack-инженер",
        "period": "2025 - Настоящее время",
        "description": "Параллельно развиваю собственные продукты с открытым кодом и самостоятельным развёртыванием и выполняю фриланс-проекты полного цикла: от анализа задачи и архитектуры до реализации, CI/CD и эксплуатации.",
        "focusAreas": [
          "Enterprise-платформы",
          "PDLC / SDLC",
          "AI-агенты",
          "Инфраструктура разработки",
          "Полный цикл поставки"
        ],
        "achievements": [
          "Создаю экосистему Base Platform: Task Tracker, Project Workflow, Fleet Control, Wiki / Evidence, Forge CI/CD и Admin Panel — единый PDLC / SDLC-контур от задачи и работы AI-агентов до проверяемого релиза.",
          "Разрабатываю Java Agent на Java 25 и Spring Boot 4.1: долгоживущие агентные сессии, REST / SSE и совместимый с OpenAI API, CLI, инструменты с политиками безопасности, MCP и Telegram-шлюз.",
          "Проектирую самостоятельно развёртываемые корпоративные инструменты с типизированными API-контрактами, аудитом, изоляцией секретов, Docker-развёртыванием и воспроизводимым выпуском.",
          "Выполняю фриланс-задачи по архитектуре, FullStack-разработке, AI-интеграциям, CI/CD и развитию существующих систем."
        ]
      },
      "en": {
        "company": "Independent / Freelance",
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
          "Developing Java Agent on Java 25 and Spring Boot 4.1 with long-running agent sessions, REST / SSE and OpenAI-compatible APIs, CLI, policy-governed tools, MCP, and a Telegram gateway.",
          "Designing self-hosted enterprise tools with typed API contracts, auditability, secret isolation, Docker deployment, and reproducible releases.",
          "Delivering freelance work across architecture, full-stack development, AI integrations, CI/CD, and existing-system evolution."
        ]
      }
    }
  },
  {
    "id": "1",
    "order": 2,
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
        "company": "WMT Group",
        "role": "Java-разработчик / архитектор",
        "period": "Апр 2022 - Март 2026",
        "description": "Разработка и архитектура портфеля сложных корпоративных систем WMT Group: PDLC-платформы полного цикла, агентные AI-системы, банковские и FinTech-сервисы, HR-продукты. Зоны ответственности — системный дизайн, безопасность, производительность, надёжность и поставка.",
        "focusAreas": [
          "Enterprise-платформы",
          "PDLC / SDLC",
          "Агентные AI-системы",
          "Банки и FinTech",
          "Безопасность и производительность"
        ],
        "achievements": [
          "Спроектировал PDLC-контур полного цикла: управление задачами, фазовые процессы, парк агентов, знания и подтверждения, Git/CI/CD и релизные проверки.",
          "Разрабатывал агентные AI-системы с оркестрацией 10+ автономных агентов, RAG, управлением контекстом и изолированными средами исполнения.",
          "Проектировал защищённые интеграции и криптографические сервисы для банковских проектов, включая цифровые подписи, аудит и работу с чувствительными данными.",
          "Проводил профилирование и оптимизацию Java/Spring-сервисов, SQL и межсервисного взаимодействия, устраняя узкие места под высокой нагрузкой.",
          "Разработал комплексную HR-платформу для рекрутинга с четырьмя независимыми модулями."
        ]
      },
      "en": {
        "company": "WMT Group",
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
        "company": "Jar Soft",
        "role": "FullStack Java-разработчик",
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
          "Построил OpenRTB-сервис аукциона, обрабатывающий ~1 миллион запросов в секунду.",
          "Спроектировал архитектуру для сервисов предиктивного моделирования на AWS.",
          "Разработал CRM-интерфейс и серверные сервисы для управления кампаниями.",
          "Настроил Aerospike и JVM для субмиллисекундного времени отклика."
        ]
      },
      "en": {
        "company": "Jar Soft",
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
    "tech": [
      "Java",
      "Frameworks",
      "Enterprise Systems"
    ],
    "locales": {
      "ru": {
        "company": "Improve Group",
        "role": "Разработчик ПО",
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
        "company": "Improve Group",
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
    "tech": [
      "Java",
      "C#",
      "Game Dev",
      "Mobile Optimization"
    ],
    "locales": {
      "ru": {
        "company": "Academ-Media",
        "role": "Разработчик ПО",
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
        "company": "Academ-Media",
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
