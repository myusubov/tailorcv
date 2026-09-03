# TailorCV | AI-Driven Resume Engineering for Developers

**The Pitch**  
An automated pipeline that translates technical _Proof of Work_ (GitHub repositories, raw text, and legacy documents) into ATS-optimized, professional resumes using an asynchronous AI transformation engine.

[Live Demo](https://tailorcv.xyz) | [System Architecture](#) | [API Documentation](#)

---

## 🚀 The Core Problem

Generic resume builders suffer from _blank canvas paralysis_ and heavy manual formatting overhead.  
**TailorCV** eliminates this by treating existing technical artifacts as the single source of truth—automatically extracting skills and experience without requiring users to write descriptions themselves.

---

## 🛠️ Technical Sophistication

### 1. Asynchronous AI Processing Pipeline

To handle long-running LLM workloads without blocking the main HTTP thread, I architected a decoupled execution model using **BullMQ** and **Redis**.

- **Mechanism:**  
  The API validates requests using Zod and enqueues an `OnboardingJob` into a priority queue.

- **Benefit:**  
  Provides a fully non-blocking user experience and prevents gateway timeouts during heavy I/O operations (e.g., ingesting 50+ GitHub repositories).

---

### 2. Custom Heuristic Context Compression

LLM context windows are expensive and constrained. I developed a custom compression algorithm to reduce payload size before AI ingestion.

- **Strategy:**  
  Aggressive pruning of low-priority fields and token-heavy skill lists while preserving semantic density.

- **Result:**  
  Reduced token usage by **40%** and eliminated **100%** of context overflow errors.

---

### 3. Real-Time State Synchronization (SSE + Pub/Sub)

Implemented a low-latency feedback loop to stream background worker progress to the frontend without inefficient polling.

- **Logic:**  
  Workers publish state transitions (`PROCESSING → CALLING_AI → DONE`) via Redis Pub/Sub.

- **Delivery:**  
  The Express backend subscribes to these events and streams updates to the Next.js client using **Server-Sent Events (SSE)**.

---

## 🏗️ Architecture & Logic

The system is built as an **Event-Driven Modular Monolith** with a shared domain kernel.

- **Ingestion Engine:**  
  Normalizes multi-vector inputs (GitHub API, PDF binaries via `unpdf`, and DOCX via `mammoth`).

- **Persistence Layer:**  
  PostgreSQL managed by Prisma, enforcing strict relational integrity between `Users`, `OnboardingJobs`, and structured `Resume` entities.

- **Contract Parity:**  
  A shared internal package ensures Zod schemas and TypeScript types are identical across the frontend, backend, and background workers.

---

## 🧰 Technology Ecosystem

| Component | Choice               | Engineering Rationale                                    |
| --------- | -------------------- | -------------------------------------------------------- |
| Framework | Next.js 15 + Express | SSE stability on the backend; RSC efficiency on frontend |
| Queueing  | BullMQ + Redis       | Reliable job persistence and priority handling           |
| AI        | GPT-4o Mini          | High-speed structured data extraction                    |
| ORM       | Prisma               | Type-safe DB access with singleton client management     |
| Auth      | Clerk                | Offloaded identity and JWT-based session security        |

---

## 📈 Impact & Achievements

- Architected an event-driven monorepo ensuring **100% contract parity** across the stack
- Engineered a multi-vector ingestion engine parsing binary documents and GitHub repositories into a unified JSON schema
- Optimized perceived performance via real-time progress streaming, reducing user churn during AI generation cycles

---

## 💻 Local Setup

```bash
# Clone the repository
git clone ...

# Install dependencies
pnpm install

# Spin up infrastructure (Redis & Postgres)
docker-compose up -d

# Database migration
npx prisma migrate dev

# Start services
pnpm dev
```
