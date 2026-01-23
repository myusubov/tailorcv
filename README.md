# TailorCV: The Trust Engine

> **Architect**: `tailorcv` Team
> **Status**: Active Development (Phase 2: Documentation)
> **Stack**: Next.js 16, Node.js, PostgreSQL, Redis

## ⚡ Mission
**TailorCV** is an AI-driven orchestration engine designed to mathematically minimize the distance between a candidate's experience and a job description's requirements. It transforms the resume creation process from a creative writing exercise into a **data-driven engineering problem**.

---

## 🏗 The Architect Stack

We utilize a **Type-Safe Monorepo** architecture to ensure absolute integrity across the full stack.

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Orchestration** | **Docker** | `latest` | Containerization and "Local Sovereignty". |
| **Frontend** | **Next.js** | `16.0.x` | React 19, Server Actions, HeroUI v3. |
| **Backend** | **Node.js** | `20.x` | Express, REST API, Worker Management. |
| **Data Integrity**| **Zod** | `v4` | Shared Schema Validation (Single Source of Truth). |
| **Persistence** | **PostgreSQL**| `15+` | Relational Data Storage (Prisma ORM). |
| **Queues** | **Redis** | `7+` | Asynchronous Job Processing. |

---

## 🚀 Local Sovereignty (Getting Started)

We prioritize **Local Sovereignty**: checking out the repo and running one command should give you the entire "Trust Engine" running on your machine.

### Prerequisites
*   Node.js 20+
*   Docker & Docker Compose (Required for Phase 3)
*   PostgreSQL & Redis (If running locally without Docker)

### Installation

1.  **Clone the Trust Engine**
    ```bash
    git clone <repo-url>
    cd tailorcv
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # This installs dependencies for Frontend, Backend, and Shared workspaces.
    ```

3.  **Environment Setup**
    Create a `.env` file in the root (see `.env.example` if available) with your credentials:
    ```env
    DATABASE_URL="postgresql://..."
    REDIS_URL="redis://..."
    OPENAI_API_KEY="sk-..."
    ```

4.  **Ignite the Engine**
    ```bash
    npm run dev
    ```
    *   **Frontend**: `http://localhost:3000`
    *   **Backend**: `http://localhost:8080`

---

## 🧠 Core Features

### 1. The Shared Truth Strategy
The `packages/shared` workspace is the mathematical heart of the system. It defines the `Zod` schemas for every piece of data (Resumes, Users, Jobs). Both the Frontend and Backend import from this package, ensuring it is **impossible** for the UI to be out of sync with the API validation logic.

### 2. Event-Driven Generation
AI Generation is slow. We don't block the user.
*   **User** submits request → **API** validates & queues → **Redis** holds job → **Worker** generates → **UI** updates optimistically.

### 3. HeroUI Experience
A premium, "wow-factor" interface built with **HeroUI v3**, featuring glassmorphism, micro-interactions, and responsive framer-motion animations.

---

## 📂 Project Structure

```bash
tailorcv/
├── apps/
│   ├── frontend/   # Next.js 16 Application
│   └── backend/    # Node.js API & Workers
├── packages/
│   └── shared/     # Shared Zod Schemas & Types
├── ARCHITECTURE.md # Detailed System Engineering Documents
└── Dockerfile      # Orchestration Logic
```

---

*Verified by the Trust Engine Protocol.*
