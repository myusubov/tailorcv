# User Story: Connect GitHub (The Hero Flow)

## Overview
The GitHub integration is the "Technical Moat" of TailorCV. Unlike simple scrapers, it performs deep semantic analysis of a developer's actual work to generate elite-level impact statements.

## The Journey

### 1. The Trigger
- **Action**: From the Onboarding page, the user clicks **"Connect GitHub"**.
- **UX Goal**: Instant recognition of a premium, secure flow.

### 2. Authentication & Permission
- **Action**: User is redirected to GitHub OAuth.
- **Requested Scopes**: `repo`, `read:user`.
- **Logic**: 
    - Verify the user.
    - Fetch the primary repositories (prioritizing original work over forks).
- **UX Goal**: Trust and transparency. Clear explanation of why we need these permissions.

### 3. Repository Selection (Discovery)
- **Action**: User sees a list of their top repositories (sorted by stars/recency).
- **Logic**: Provide a search/filter bar. User selects 1–3 "Hero Repositories" that best represent their skills.
- **UX Goal**: Empower the user to put their best foot forward.

### 4. Deep Extraction (The Magic Begins)
- **Action**: A "Scanning Your Impact" animation appears.
- **Logic (Background)**:
    - **Step A**: Fetch `package.json` to identify the tech stack (e.g., Next.js 15, TanStack Query).
    - **Step B**: Fetch the last 50–100 commits and PR descriptions.
    - **Step C**: Use Node.js streams to process diffs efficiently.
    - **Step D**: Send data to Claude 3.5 Sonnet to translate "Code Changes" into "Business Impact".
- **Example Transformation**:
    - *Raw*: "Fixed memory leak in useEffect"
    - *TailorCV*: "Optimized React lifecycle management, reducing client-side memory overhead by 15% and improving interaction-to-next-paint (INP) metrics."

### 5. Semantic Review
- **Action**: User is presented with a list of generated **Impact Statements**.
- **Features**:
    - **Edit**: User can tweak the wording.
    - **Regenerate**: User can ask for a different tone (e.g., more "Architectural" vs "Product-focused").
    - **Select**: User picks the best statements for their resume.

### 6. Seamless Integration
- **Action**: User clicks "Finalize".
- **Logic**: Selected statements are synced to the local IndexedDB and the PostgreSQL backend.
- **Outcome**: The resume is now populated with elite, data-backed bullet points that prove their expertise.

---

## Technical Flexes (Proof of Work)
- **Node.js Streams**: Handling large commit histories without crashing the server.
- **Prompt Engineering**: Claude 3.5 Sonnet instructions that prevent hallucination and focus on architectural patterns.
- **Local-First Sync**: Using IndexedDB to ensure the user doesn't lose progress if the extraction takes time or the connection drops.
