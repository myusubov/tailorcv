1. Core Architectural Pillar: Local-First Persistence
To demonstrate mastery over complex state and browser storage, TailorCV operates on a Local-First model.

Storage Layer: IndexedDB is the primary source of truth for the frontend.

Sync Logic: Changes made to the resume are instantly persisted locally and queued for background synchronization with the PostgreSQL database via Prisma.

User Benefit: Zero-latency UI. The app remains fully functional during network drops, proving the developer can handle sophisticated synchronization patterns.

2. The "Hero" Feature: GitHub Semantic Parser
This feature is the primary technical moat designed to impress recruiters.

Data Extraction: Uses GitHub OAuth to fetch the last 100 commits, PR descriptions, and package.json files from the user's top-tier repositories.

AI Processing: Sends raw commit diffs to the Claude 3.5 Sonnet API with a strictly engineered prompt to extract "Quantified Impact".

Semantic Mapping:

Junior approach: "I built an e-commerce site."

Elite approach (TailorCV): "Implemented Stripe-based payment orchestration in a Next.js environment, handling complex webhook states and improving checkout reliability."

Tech Stack: Node.js streams for processing large commit data; Claude API for semantic inference.

3. Backend & Database Strategy
Schema Design: The Prisma schema is designed for multi-tenancy to support future B2B recruitment agency sub-accounts.

Redis Integration: Used for rate-limiting the heavy GitHub API calls and caching Claude API responses to reduce costs.

State Machine: Custom backend logic to track the "Resume State" (e.g., Draft, Analyzing, Optimized) to ensure the UI reflects the background AI processing accurately.

4. PDF Rendering & ATS Optimization
Engine: @react-pdf/renderer used on the client-side to minimize server costs.

ATS Logic: The PDF is generated using a minimalist, single-column structure to ensure 100% parse-ability across legacy enterprise systems (e.g., Workday, Greenhouse).

Accessibility: Implements semantic PDF tagging to make the resume readable by screen readers, a key requirement for modern corporate compliance.