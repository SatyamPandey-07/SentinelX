# SentinelX - Linux, OS Internals & Systems Engineering Operations

## 1. Operating System Fundamentals for Distributed Systems

Operating high-throughput microservices requires a deep understanding of Linux kernel mechanics, thread scheduling, socket states, and container namespaces.

---

## 2. Process, Thread & JVM Mechanics

### Linux Thread Model
In Linux (NPTL - Native POSIX Thread Library), threads are lightweight processes (`clone(2)` system call with shared virtual address space, file descriptor table, and signal handlers). 
- Every Java platform thread corresponds 1:1 to a Linux task (`task_struct`).
- **Context Switches**: In high-concurrency Spring Boot applications with traditional thread-per-request models (Tomcat 200 worker threads), excessive context switching degrades CPU efficiency due to L1/L2 cache invalidation.
- **Java 21 Virtual Threads (Project Loom)**: SentinelX leverages Java 21 Virtual Threads where applicable, multiplexing thousands of lightweight virtual threads onto a small pool of carrier OS threads to eliminate thread pool exhaustion during blocking I/O (e.g., waiting for PostgreSQL or Redis responses).

---

## 3. Memory Architecture: JVM vs Linux Cgroup Limits

A critical production failure in containerized Java is `OOMKilled` (Exit Code 137).

$$\text{Total Memory} = \text{Heap} (-Xmx) + \text{Metaspace} + \text{Thread Stacks} (Threads \times -Xss) + \text{Direct Byte Buffers (Netty/Kafka)} + \text{JVM Code Cache}$$

- In Kubernetes, `resources.limits.memory` sets the Linux Cgroup memory limit.
- If JVM Heap is set to `2GB` on a container with a `2.5GB` limit, Netty direct memory buffers or thread stacks can cause the total process footprint to exceed `2.5GB`, prompting the Linux kernel OOM Killer to terminate the JVM without producing a heap dump.
- **SentinelX Recommendation**: Set `-XX:MaxRAMPercentage=70.0` and reserve 30% container overhead for off-heap memory, Netty buffers, and OS caches.

---

## 4. File Descriptors & Socket Management

Every TCP connection (PostgreSQL JDBC connection, Redis client, Kafka producer/consumer, incoming HTTP client) consumes a Linux file descriptor.

### Ephemeral Port Exhaustion & `TIME_WAIT` Sockets
When an HTTP/1.1 client repeatedly opens and closes connections to an upstream service without connection pooling (Keep-Alive), sockets linger in the `TIME_WAIT` state for 60 seconds (`2 * MSL`).
- Under heavy load, the host exhausts its ephemeral port range (`net.ipv4.ip_local_port_range`).
- **SentinelX Mitigation**: High-performance HTTP connection pools (Apache HttpClient / Reactor Netty) with HTTP Keep-Alive, and tuned sysctl parameters:
  ```bash
  sysctl -w net.ipv4.tcp_tw_reuse=1
  sysctl -w fs.file-max=2097152
  ```

---

## 5. Linux Operational Command Reference

### Process & Thread Inspection
```bash
# View top threads consuming CPU within a JVM process (PID 1420)
top -H -p 1420

# Generate a thread dump directly from the OS
jcmd 1420 Thread.print > /tmp/threaddump.txt

# Inspect file descriptors held by a process
ls -l /proc/1420/fd | wc -l
```

### Network & Socket Debugging
```bash
# Check TCP connection state distribution for port 8080
ss -s
ss -ant '( sport = :8080 or dport = :8080 )' | awk '{print $1}' | sort | uniq -c

# Capture raw HTTP/gRPC packet traffic on port 9094 (Location gRPC)
tcpdump -i any -nn -vvv port 9094 -c 20

# Verify DNS resolution latency inside a pod
dig @10.96.0.10 auth-service.sentinelx-prod.svc.cluster.local +stats
```

### Disk & Kernel Diagnostics
```bash
# Check kernel out-of-memory events
dmesg -T | grep -i oom

# Inspect I/O wait latency across storage volumes
iostat -xz 1 5
```
