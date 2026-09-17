Processing 1 million requests per second within strict 100ms OpenRTB timeouts requires fundamental architectural shifts. This article describes the patterns and optimizations that stabilized the AdTech bidder under extreme load.

**The OpenRTB Challenge**

Real-time bidding auctions have non-negotiable constraints: 100ms total timeout, including network latency, database lookups, and bid calculation. Standard architectures fail catastrophically at this scale.

**Database Layer: The Aerospike Migration**

Relational databases became the primary bottleneck. We migrated hot data (campaign configs, user segments, bid floors) to Aerospike, achieving:

- Sub-millisecond read latency (0.3-0.8ms p99)
- Horizontal scaling across 12-node cluster
- In-memory data structures with SSD persistence
- Automatic data distribution and rebalancing

**Key Optimizations:**

- **Namespace design**: Separated hot vs. warm data into different namespaces with distinct retention policies
- **Record sizing**: Optimized record structure to fit within single-node memory limits
- **Write policy tuning**: Configured write-through persistence with async replication
- **Query patterns**: Eliminated secondary indexes, using primary key lookups exclusively

**Network Layer: gRPC vs REST**

Moving from REST/JSON to gRPC provided significant performance gains:

- **Payload reduction**: Protocol Buffers reduced message size by 60-70% vs JSON
- **Serialization overhead**: Binary encoding eliminated JSON parsing bottlenecks
- **HTTP/2 multiplexing**: Single connection handling multiple concurrent requests
- **Streaming support**: Bidirectional streams for real-time campaign updates

**Performance Impact:**

- Network latency reduction: 15-20ms → 3-5ms per request
- CPU usage: lower serialization overhead
- Throughput: 3x improvement in requests per CPU core

**JVM Tuning for Extreme Throughput**

Java GC pauses were unacceptable at this scale. We implemented:

- **G1GC tuning**: MaxGCPauseMillis=10ms, InitiatingHeapOccupancyPercent=45
- **Off-heap memory**: Direct memory allocation for network buffers
- **Thread pool optimization**: Custom executor with work-stealing queues
- **NUMA awareness**: CPU affinity for critical threads

**System-Level Optimizations**

- **Kernel parameters**: Increased socket buffer sizes, TCP tuning for high throughput
- **Load balancing**: NGINX with consistent hashing for session affinity
- **Circuit breakers**: Fast-fail mechanisms preventing cascade failures
- **Rate limiting**: Token bucket algorithm with distributed coordination

**Architecture Patterns**

- **Horizontal partitioning**: Sharded data by campaign ID and user segment
- **Caching strategy**: Multi-layer cache (L1: local, L2: distributed Redis)
- **Async processing**: Non-blocking I/O throughout the stack
- **Predictive modeling**: Pre-computed bid values cached for common scenarios

**Results**

- **Throughput**: Stable processing at the target load of about 1M RPS
- **Latency**: p99 response time: 85ms (15ms headroom under 100ms limit)
- **Resource efficiency**: lower infrastructure cost than the initial design
- **Scalability**: Linear scaling to 2M+ RPS with additional nodes

**Lessons Learned**

- Database choice is critical: NoSQL in-memory stores are essential for sub-millisecond access
- Protocol matters: gRPC provides measurable performance advantages at scale
- JVM tuning requires deep understanding: GC behavior directly impacts tail latency
- Observability is non-negotiable: Without comprehensive metrics, optimization is guesswork
