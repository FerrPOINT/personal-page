import { ExperienceItem, Project, BlogPost, TechSkill } from '../types';

export const NAV_ITEMS = [
  { label: 'About', href: '#hero' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'Insights', href: '#insights' },
  { label: 'Contact', href: '#contact' },
];

export const EXPERIENCE: ExperienceItem[] = [
  {
    id: '1',
    role: 'Java Developer / Architect',
    company: 'WMT Group',
    period: 'Apr 2022 - Present',
    description: 'Leading development of complex distributed systems, including Multi-Agent AI architecture, FinTech security services, and HR platforms.',
    achievements: [
      'Architected a Multi-Agent System using LangChain/LangGraph with 10+ autonomous agents.',
      'Developed a comprehensive HR Recruiting Platform (Full-Stack) with 4 independent modules.',
      'Implemented Cryptographic Services (GOST algorithms) handling high-load digital signatures.',
      'Established end-to-end CI/CD pipelines in GitLab with automated security scanning.'
    ],
    tech: ['Java 21', 'Spring Boot 3', 'Python', 'LangChain', 'PostgreSQL', 'React', 'Kubernetes']
  },
  {
    id: '2',
    role: 'FullStack Java Software Engineer',
    company: 'Jar Soft',
    period: 'Jan 2017 - Feb 2022',
    description: 'Developed high-load distributed server systems and AdTech solutions processing ~1 million RPS.',
    achievements: [
      'Built an OpenRTB bidder system processing ~1 million requests per second.',
      'Designed architecture for predictive modeling services on AWS.',
      'Developed CRM UI and backend services for campaign management.',
      'Tuned Aerospike and JVM for sub-millisecond response times.'
    ],
    tech: ['Java', 'Spring Boot', 'AWS', 'Aerospike', 'MySQL', 'gRPC', 'React', 'OpenRTB']
  },
  {
    id: '3',
    role: 'Software Developer',
    company: 'Improve Group',
    period: 'Aug 2016 - Dec 2016',
    description: 'Software modification and framework research.',
    achievements: [
      'Rapid adoption of new frameworks and technologies for client projects.',
      'Modification and support of existing enterprise applications.'
    ],
    tech: ['Java', 'Frameworks', 'Enterprise Systems']
  },
  {
    id: '4',
    role: 'Software Developer',
    company: 'Academ-Media',
    period: 'Aug 2015 - Aug 2016',
    description: 'Game development and engine optimization for mobile platforms.',
    achievements: [
      'Optimized game engine for resource-constrained mobile devices.',
      'Developed Universal Windows Platform (UWP) applications in C#.'
    ],
    tech: ['Java', 'C#', 'Game Dev', 'Mobile Optimization']
  }
];

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Multi-Agent AI System',
    description: 'Orchestration of 10+ autonomous AI agents with RAG infrastructure.',
    fullDescription: 'Designed and optimized a complex multi-agent system using LangChain and LangGraph. The system orchestrates over 10 specialized agents to handle diverse tasks with context preservation. Integrated a RAG (Retrieval-Augmented Generation) system using ChromaDB to reduce hallucinations and improve relevance. Responsible for the full MLOps pipeline, including containerization of agents and scaling vector databases.',
    role: 'Architect / DevOps',
    challenges: [
      'Orchestrating 10+ stateful agents with complex inter-communication logic.',
      'Implementing RAG for large unstructured datasets with low latency.',
      'Deploying Python-based AI services alongside Java microservices.'
    ],
    results: [
      'Achieved stable orchestration of 10+ concurrent agents.',
      'Reduced hallucination rates by integrating RAG with ChromaDB.',
      'Established a robust Docker-based deployment pipeline for AI services.'
    ],
    categories: ['AI', 'DevOps', 'FullStack'],
    metrics: ['10+ Agents', 'RAG Integration', 'LangGraph'],
    stack: ['Python', 'LangChain', 'Docker', 'ChromaDB', 'Telegram API', 'Google APIs'],
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'p2',
    title: 'High-Load AdTech Bidder',
    description: 'Real-time bidding system processing 1 Million+ RPS on AWS.',
    fullDescription: 'Developed a high-performance OpenRTB bidder capable of handling ~1 million requests per second. The project involved Full-Stack development (CRM UI + Backend) and deep DevOps work on AWS. Implemented predictive modeling services and optimized the network stack for extreme throughput. Migrated hot data to Aerospike for sub-millisecond access.',
    role: 'FullStack / SRE',
    challenges: [
      'Processing 1M+ RPS within strict 100ms OpenRTB timeouts.',
      'Optimizing Java GC and kernel parameters for high throughput.',
      'Building a user-friendly CRM for campaign management.'
    ],
    results: [
      'Stable performance at 1M RPS with 99.99% availability.',
      'Successful migration to Aerospike reducing read latency.',
      'Comprehensive AWS infrastructure automation.'
    ],
    categories: ['AI', 'DevOps', 'FullStack'],
    metrics: ['1M+ RPS', 'AWS', 'Aerospike'],
    stack: ['Java', 'Spring Boot', 'AWS', 'Aerospike', 'React', 'gRPC', 'MySQL'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'p3',
    title: 'HR Recruiting Platform',
    description: 'Full-cycle recruiting ecosystem with 4 modules and CI/CD pipelines.',
    fullDescription: 'Built a comprehensive HR platform consisting of 4 independent modules (Recruiter, Candidate, Logic, AI Matching). handled the Full-Stack development (Java/Spring + React/TS) and the DevOps pipeline. Implemented automated matching algorithms, JWT security across modules, and set up a complete GitLab CI/CD pipeline deploying to development, staging, and production environments.',
    role: 'FullStack / DevOps',
    challenges: [
      'Synchronizing 4 independent modules with a unified auth system.',
      'Creating complex SQL algorithms for candidate-vacancy matching.',
      'Automating deployment of the entire microservice fleet.'
    ],
    results: [
      'Fully automated CI/CD pipeline reducing deployment time by 90%.',
      'Seamless user experience across Recruiter and Candidate portals.',
      'High-performance matching logic using native SQL optimization.'
    ],
    categories: ['DevOps', 'FullStack'],
    metrics: ['4 Modules', 'GitLab CI/CD', 'React + Java'],
    stack: ['Java', 'Spring Boot', 'React', 'TypeScript', 'GitLab CI', 'Docker', 'PostgreSQL'],
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'p4',
    title: 'FinTech Crypto Services',
    description: 'Secure microservices for GOST digital signatures and certificates.',
    fullDescription: 'Designed a suite of microservices for banking-grade cryptographic operations. Implemented GOST algorithms for digital signatures and encryption. The system was built with an event-driven architecture using Kafka to handle load spikes during reporting periods. DevOps responsibilities included Kubernetes orchestration, Helm charting, and security hardening.',
    role: 'Backend / Infra',
    challenges: [
      'Integrating legacy GOST crypto-libraries into modern Spring Boot apps.',
      'Ensuring compliance with strict banking security standards.',
      'Handling massive spikes in signing requests asynchronously.'
    ],
    results: [
      'Passed external security audits with zero critical vulnerabilities.',
      'Scalable K8s architecture handling 500% load spikes.',
      'Reliable event-driven processing via Kafka.'
    ],
    categories: ['DevOps', 'FullStack'],
    metrics: ['GOST Crypto', 'Kubernetes', 'Kafka'],
    stack: ['Java 21', 'Spring Boot 3', 'Kubernetes', 'Kafka', 'PostgreSQL', 'Vault'],
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop'
  }
];

export const SKILLS: TechSkill[] = [
  { name: 'Java / Spring', level: 98, category: 'Languages' },
  { name: 'System Design', level: 95, category: 'Infrastructure' },
  { name: 'DevOps (K8s/Docker)', level: 92, category: 'Infrastructure' },
  { name: 'Python / AI', level: 85, category: 'AI' },
  { name: 'React / TS', level: 80, category: 'Frameworks' },
  { name: 'High-Load / AWS', level: 90, category: 'Infrastructure' },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: 'Production-Ready Multi-Agent AI: Lessons from Orchestrating 10+ LangGraph Agents',
    date: 'Dec 2025',
    readTime: '~5 min',
    category: 'AI Architecture',
    excerpt: 'Real-world insights from building a production multi-agent system with LangGraph, RAG integration, and state management at scale.',
    content: "Building production-grade multi-agent AI systems requires moving beyond proof-of-concept implementations to architectures that handle real-world complexity. In this article, I share practical lessons from architecting a system orchestrating 10+ specialized agents using LangGraph and LangChain.\n\n**The Challenge: Beyond Sequential Chains**\n\nTraditional LangChain sequential chains fall short when dealing with complex workflows requiring parallel execution, conditional routing, and persistent state. Our system needed agents that could collaborate, share context, and make dynamic decisions based on intermediate results.\n\n**Graph-Based Orchestration with LangGraph**\n\nLangGraph's directed acyclic graph (DAG) architecture provided the foundation for sophisticated agent coordination. Unlike sequential chaining, we implemented:\n\n- **Centralized state management**: Agents communicate through immutable state objects rather than direct peer-to-peer messaging, eliminating complex routing logic\n- **Conditional edges**: Dynamic workflow routing based on agent confidence scores and external system statuses\n- **Parallel execution**: Specialized agents (document processing, analysis, synthesis) operate concurrently while maintaining coordination\n- **Subgraph composition**: Reusable agent groups for common patterns like document analysis pipelines\n\n**State Management at Scale**\n\nOne critical insight: LangGraph's immutable state updates prevent race conditions but increase memory usage as workflows grow. We implemented:\n\n- Typed state schemas ensuring agent outputs align with expectations\n- Persistent checkpointing for long-running conversations\n- State versioning for debugging and rollback capabilities\n\n**RAG Integration with ChromaDB**\n\nIntegrating Retrieval-Augmented Generation reduced hallucination rates by 40% compared to base models. Key implementation details:\n\n- Vector database optimization for sub-100ms retrieval latency\n- Context window management to balance relevance and token limits\n- Multi-stage retrieval: coarse-grained filtering followed by semantic ranking\n\n**Production Deployment Considerations**\n\nDebugging multi-agent systems requires specialized observability. We implemented:\n\n- Full production tracing for diagnosing non-deterministic agent failures\n- Moderation loops with human-in-the-loop verification at critical decision points\n- Durable execution with checkpoint recovery for long-running workflows\n\n**Key Metrics**\n\n- System handles thousands of concurrent sessions\n- Average agent coordination latency: <200ms\n- State consistency: 99.9% across distributed nodes\n- RAG retrieval accuracy improvement: 40% reduction in hallucinations\n\nThe architecture now powers a production system processing complex multi-step reasoning tasks with reliability and scalability."
  },
  {
    id: 'b2',
    title: 'Achieving 1M+ RPS: Architecture Patterns for Extreme-Scale AdTech Systems',
    date: 'Dec 2025',
    readTime: '~5 min',
    category: 'High-Load',
    excerpt: 'Deep dive into building a real-time OpenRTB bidder processing 1 million requests per second: Aerospike optimization, gRPC performance, and JVM tuning.',
    content: "Processing 1 million requests per second within strict 100ms OpenRTB timeouts requires fundamental architectural shifts. This article details the patterns and optimizations that enabled our AdTech bidder to achieve 99.99% availability at extreme scale.\n\n**The OpenRTB Challenge**\n\nReal-time bidding auctions have non-negotiable constraints: 100ms total timeout, including network latency, database lookups, and bid calculation. Standard architectures fail catastrophically at this scale.\n\n**Database Layer: The Aerospike Migration**\n\nRelational databases became the primary bottleneck. We migrated hot data (campaign configs, user segments, bid floors) to Aerospike, achieving:\n\n- Sub-millisecond read latency (0.3-0.8ms p99)\n- Horizontal scaling across 12-node cluster\n- In-memory data structures with SSD persistence\n- Automatic data distribution and rebalancing\n\n**Key Optimizations:**\n\n- **Namespace design**: Separated hot vs. warm data into different namespaces with distinct retention policies\n- **Record sizing**: Optimized record structure to fit within single-node memory limits\n- **Write policy tuning**: Configured write-through persistence with async replication\n- **Query patterns**: Eliminated secondary indexes, using primary key lookups exclusively\n\n**Network Layer: gRPC vs REST**\n\nMoving from REST/JSON to gRPC provided significant performance gains:\n\n- **Payload reduction**: Protocol Buffers reduced message size by 60-70% vs JSON\n- **Serialization overhead**: Binary encoding eliminated JSON parsing bottlenecks\n- **HTTP/2 multiplexing**: Single connection handling multiple concurrent requests\n- **Streaming support**: Bidirectional streams for real-time campaign updates\n\n**Performance Impact:**\n\n- Network latency reduction: 15-20ms → 3-5ms per request\n- CPU usage: 40% reduction in serialization overhead\n- Throughput: 3x improvement in requests per CPU core\n\n**JVM Tuning for Extreme Throughput**\n\nJava GC pauses were unacceptable at this scale. We implemented:\n\n- **G1GC tuning**: MaxGCPauseMillis=10ms, InitiatingHeapOccupancyPercent=45\n- **Off-heap memory**: Direct memory allocation for network buffers\n- **Thread pool optimization**: Custom executor with work-stealing queues\n- **NUMA awareness**: CPU affinity for critical threads\n\n**System-Level Optimizations**\n\n- **Kernel parameters**: Increased socket buffer sizes, TCP tuning for high throughput\n- **Load balancing**: NGINX with consistent hashing for session affinity\n- **Circuit breakers**: Fast-fail mechanisms preventing cascade failures\n- **Rate limiting**: Token bucket algorithm with distributed coordination\n\n**Architecture Patterns**\n\n- **Horizontal partitioning**: Sharded data by campaign ID and user segment\n- **Caching strategy**: Multi-layer cache (L1: local, L2: distributed Redis)\n- **Async processing**: Non-blocking I/O throughout the stack\n- **Predictive modeling**: Pre-computed bid values cached for common scenarios\n\n**Results**\n\n- **Throughput**: Stable 1M+ RPS with 99.99% availability\n- **Latency**: p99 response time: 85ms (15ms headroom under 100ms limit)\n- **Resource efficiency**: 40% reduction in infrastructure costs vs. initial design\n- **Scalability**: Linear scaling to 2M+ RPS with additional nodes\n\n**Lessons Learned**\n\n- Database choice is critical: NoSQL in-memory stores are essential for sub-millisecond access\n- Protocol matters: gRPC provides measurable performance advantages at scale\n- JVM tuning requires deep understanding: GC behavior directly impacts tail latency\n- Observability is non-negotiable: Without comprehensive metrics, optimization is guesswork"
  },
  {
    id: 'b3',
    title: 'GOST Cryptography in Modern FinTech: Event-Driven Architecture for High-Load Digital Signatures',
    date: 'Dec 2025',
    readTime: '~5 min',
    category: 'Security',
    excerpt: 'Implementing GOST algorithms in cloud-native microservices: Kubernetes deployment, Kafka event streaming, and handling 500% load spikes.',
    content: "Integrating GOST cryptographic standards into modern Java microservices presents unique challenges: legacy library compatibility, performance under load, and compliance with strict banking security standards. This article details our approach to building a production-grade cryptographic service handling millions of digital signatures.\n\n**The GOST Challenge**\n\nGOST-256 and GOST-3411 algorithms are mandatory for Russian FinTech compliance, but integrating legacy Bouncy Castle libraries into cloud-native architectures requires careful design.\n\n**Microservice Architecture**\n\nWe encapsulated cryptographic operations into a dedicated microservice with clear boundaries:\n\n- **Isolated scaling**: Crypto service scales independently based on signing request volume\n- **Resource isolation**: Heavy cryptographic operations don't impact user-facing APIs\n- **Security hardening**: Reduced attack surface through minimal dependencies\n- **Compliance boundary**: All GOST operations contained within auditable service\n\n**Event-Driven Design with Kafka**\n\nSynchronous cryptographic operations create unacceptable latency spikes. We implemented an event-driven architecture:\n\n- **Request decoupling**: User-facing APIs publish signing requests to Kafka topics\n- **Async processing**: Dedicated consumer groups process signatures asynchronously\n- **Result streaming**: Completed signatures published back through Kafka for API consumption\n- **Dead letter queues**: Failed operations routed to DLQ for manual review\n\n**Benefits:**\n\n- **Latency isolation**: API response times unaffected by cryptographic processing\n- **Backpressure handling**: Kafka buffers handle traffic spikes gracefully\n- **Retry logic**: Automatic retries for transient failures\n- **Observability**: Full request tracing through Kafka message headers\n\n**Kubernetes Deployment Strategy**\n\nContainerized cryptographic services require special considerations:\n\n- **Resource limits**: CPU-intensive operations need guaranteed CPU allocation\n- **Horizontal Pod Autoscaling**: Scale based on Kafka consumer lag metrics\n- **Pod Disruption Budgets**: Ensure minimum availability during cluster maintenance\n- **Network policies**: Restrict inter-service communication to required paths only\n\n**Handling Load Spikes**\n\nEnd-of-quarter reporting periods generate 500% traffic spikes. Our architecture handles this through:\n\n- **Kafka partitioning**: 32 partitions allow parallel processing across consumer instances\n- **Consumer group scaling**: Auto-scaling from 4 to 20 pods during peak periods\n- **Batch processing**: Configurable batch sizes for optimal throughput\n- **Circuit breakers**: Prevent cascade failures when downstream services are overwhelmed\n\n**Performance Optimizations**\n\n- **Connection pooling**: Reused Kafka producer/consumer connections\n- **Batching**: Grouped multiple signing requests into single Kafka messages\n- **Caching**: Cached frequently-used certificate chains and public keys\n- **Hardware acceleration**: Evaluated HSM integration for future performance gains\n\n**Security Considerations**\n\n- **Key management**: Integration with HashiCorp Vault for secure key storage\n- **Audit logging**: Comprehensive logging of all cryptographic operations\n- **Access control**: RBAC policies restricting service-to-service communication\n- **Compliance**: External security audits passed with zero critical vulnerabilities\n\n**Results**\n\n- **Throughput**: Handles 500% load spikes without degradation\n- **Latency**: 95th percentile signing time: 120ms (async processing)\n- **Availability**: 99.95% uptime with Kubernetes self-healing\n- **Compliance**: Passed external security audits with zero critical findings\n- **Scalability**: Linear scaling to 10x baseline load with additional pods\n\n**Key Takeaways**\n\n- Event-driven architecture is essential for CPU-intensive operations\n- Kafka provides natural backpressure and retry mechanisms\n- Kubernetes enables dynamic scaling for variable workloads\n- Microservice isolation simplifies security and compliance boundaries\n- Async processing transforms latency from blocking to non-blocking concern"
  }
];

