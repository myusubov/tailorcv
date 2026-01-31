# ADR 001: AI Chat Feature for Resume Review

## Status

**Implemented** - January 30, 2026

## Context

Users reviewing their resumes need an intelligent, context-aware assistant to provide real-time feedback, rephrasing suggestions, and career advice without leaving the editor. The experience must be visually "premium" (animations, glassmorphism), highly responsive (streaming), and persistent across navigation.

## Functional Specification

The AI Chat feature provides a continuously accessible drawer interface with the following capabilities:

### 1. Interactive Chat Interface
-   **Persistent Drawer**: Fixed-position chat window (`w-100` or `w-180`) that stays open while users edit their resume.
-   **Fullscreen Mode**: One-click expansion for a focused, distraction-free writing experience.
-   **Input Experience**: Auto-expanding text area that supports multi-line input (Shift+Enter) and immediate submission (Enter).
-   **Quick Actions**: Horizontally scrollable "chips" for common requests (e.g., "Improve summary", "Fix grammar").

### 2. Conversation Management (Sidebar)
-   **History**: Sidebar lists past conversations, ordered by most recent activity.
-   **Management**: Users can create **New Chats** or **Delete** old usage contexts.
-   **Empty States**: Clean, user-friendly empty states when no history exists.

### 3. Context Awareness
-   **Resume Injection**: The AI automatically receives the user's *current* resume data (work experience, skills, summary) as system context.
-   **Personalized Responses**: Answers are tailored to the specific user's career history, not generic advice.

---

## Technical Architecture

### 1. Frontend Implementation (Next.js 16 + HeroUI)

-   **Global State**: `AIChatProvider` (Context API) manages visibility, active conversation ID, and message history globally. This ensures the chat doesn't reset when navigating between pages.
-   **Components**:
    -   `AIChatBox`: The shell handling layout, animations (Framer Motion), and sidebar toggling.
    -   `ChatSidebar`: Handles fetching (`useConversationsQuery`) and mutations (`deleteConversationAction`) for thread management.
    -   `ChatInputArea`: Complex input handling with specific `Framer Motion` layout IDs for smooth shared-element transitions between formatted/fullscreen modes.
    -   `ChatMessageList`: Handles auto-scrolling to the bottom using `requestAnimationFrame` for buttery smooth behavior during high-speed text streaming.

### 2. Backend Implementation (Express + Prisma)

-   **Controller (`ai-chat.controller.ts`)**:
    -   Orchestrates the flow.
    -   Handles implicit conversation creation (if `conversationId` is missing).
    -   initiates the SSE stream.
-   **Service Layer (`ai-chat.service.ts`)**:
    -   Interacts with OpenAI API (`gpt-4o`).
    -   **Prompt Engineering**: Dynamically builds system instructions injecting `resumeContext` JSON.
-   **Persistence Layer (`chat-conversations.service.ts`)**:
    -   Uses `Prisma` to store `ChatConversation` and `ChatMessage` records.
    -   Ensures data sovereignty (users only see their own chats).

### 3. Streaming Architecture (Route Proxy Pattern)

We deviated from standard Server Actions for the core chat stream to support robust Server-Sent Events (SSE).

-   **Flow**: Client (`fetchEventSource`) -> Next.js Proxy (`app/api/ai/chat/route.ts`) -> Backend Controller -> OpenAI.
-   **DAL Helper**: `lib/data/ai-chat.ts` encapsulates the `backendStream` logic.
-   **Protocol**: `text/event-stream`.
-   **Events**:
    -   `text`: Incremental token chunks.
    -   `done`: Final payload containing the new `responseId` and `conversationId`.
    -   `error`: Logic-level errors.

### 4. Database Schema

-   **ChatConversation**: `id`, `userId`, `title`, `full_response_id`.
-   **ChatMessage**: `id`, `conversationId`, `role` (user/assistant), `content` (Text).
-   **Indexes**: Optimized on `userId` + `updatedAt` for fast history loading.

---

## Key Decisions & Log

### error Handling Strategy
-   **Problem**: Backend errors (e.g., Prisma crashes, API timeouts) were leaking raw stack traces to the frontend toast notifications.
-   **Solution**: Implemented **Edge Sanitization**.
    -   Backend catches exceptions and logs them fully to `stdout`/`logger`.
    -   Backend returns a generic `connection_failed` or JSON error code.
    -   Frontend Provider (`AIChatProvider`) traps `error` events and displays "Sorry, something went wrong" to the user, completely hiding technical details.

### Navigation & Persistence
-   **Decision**: Moved `AIChatBox` out of the page tree and into the `RootLayout` (via Provider).
-   **Reasoning**: Users need to browse different resume sections (switching Next.js pages) without the chat window closing or clearing context.

### Sidebar Integration
-   **Decision**: Integrated `ChatSidebar` directly inside `AIChatBox` rather than a separate floating element.
-   **Result**: Creates a cohesive "IDE-like" feel where tools are bundled together.

### API Proxy vs Server Actions
-   **Decision**: Used `route.ts` for streaming.
-   **Reasoning**: Vercel AI SDK or raw Server Actions require custom stream encoding. Standard SSE (`text/event-stream`) via an API Route provided the most reliable, compatible transport for our separate Backend/Frontend architecture.

---

## Future improvements
-   **Model Switching**: Allow users to toggle between fast (GPT-3.5) and smart (GPT-4) models.
-   **Citation Support**: Parse OpenAI responses to highlight exactly which resume section is being referenced.
