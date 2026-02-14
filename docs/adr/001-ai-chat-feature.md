# ADR 001: AI Chat Feature for Resume Review

## Status

**Implemented** - January 30, 2026
**Optimized** - February 12, 2026
**Synchronized** - February 14, 2026

## Context

Users reviewing their resumes need an intelligent, context-aware assistant to provide real-time feedback, rephrasing suggestions, and career advice without leaving the editor. The experience must be visually "premium", highly responsive, and cost-effective.

## Functional Specification

The AI Chat feature provides a continuously accessible drawer interface with the following capabilities:

### 1. Interactive Chat Interface

- **Persistent Drawer**: Fixed-position chat window that stays open while users edit their resume.
- **Fullscreen Mode**: One-click expansion for a focused, distraction-free writing experience.
- **Input Experience**: Auto-expanding text area with multi-line support.
- **Quick Actions**: Horizontally scrollable "chips" for common requests.

### 2. Conversation Management (Sidebar)

- **History**: Sidebar lists past conversations, ordered by most recent activity.
- **Management**: Users can create **New Chats** or **Delete** old usage contexts.

### 3. Context Awareness

- **Resume Injection**: The AI automatically receives the user's _current_ resume data.
- **Sanitization**: Context is automatically stripped of internal database IDs and unnecessary metadata to minimize token usage and cost.

---

## Technical Architecture

### 1. Frontend Implementation (Next.js 16 + HeroUI)

- **Global State**: `AIChatProvider` (Context API) manages visibility, active conversation ID, and message history globally.
- **Components**: `AIChatBox`, `ChatSidebar`, `ChatInputArea`, `ChatMessageList`.

### 2. Backend Implementation (Express + Prisma)

- **Controller (`ai-chat.controller.ts`)**: Orchestrates the flow and initiates SSE streams.
- **Service Orchestrator (`ai-chat.service.ts`)**: Acts as a lightweight coordinator between modular utilities.
- **Modular Utilities**:
  - `ai-context.ts`: Handles strictly typed resume data sanitization (removes IDs, whitespace).
  - `ai-prompts.ts`: Encapsulates system instruction building.
  - `ai-intent.ts`: Implements `gpt-4o-mini` based intent classification for model routing.
- **Persistence Layer (`chat-conversations.service.ts`)**: Uses Prisma for storing threads and messages.

### 3. Streaming Architecture (Route Proxy Pattern)

- **Flow**: Client -> Next.js Proxy -> Backend Controller -> OpenAI.
- **Protocol**: `text/event-stream` (SSE).

---

## Key Decisions & Log

### Intent-Based Model Selection (Added Feb 12)

- **Decision**: Default to `gpt-4o-mini` for all queries and use it to classify intent. Route 'complex' requests (e.g., full section rewrites) to `gpt-4o`.
- **Reasoning**: `gpt-4o-mini` is ~90% cheaper and provides adequate performance for 90% of user queries. A lightweight router call (<300ms) preserves accuracy without significant latency.

### Token Hygiene & Context Sanitization (Added Feb 12)

- **Decision**: Strip all `id` fields from the `resumeContext` and remove pretty-printing from JSON stringification.
- **Reasoning**: Database IDs add no value to the AI context but consume high amounts of tokens across many turns. Minifying the JSON further reduces token overhead by 5-10%.

### Modularization of AI Logic (Added Feb 12)

- **Decision**: Extract prompt building, context cleaning, and intent classification into separate utility modules.
- **Reasoning**: Prevents the `ai-chat.service.ts` from becoming a monolithic "god file" and improves testability of individual components (e.g., unit testing the context cleaner).

### Client-Driven ID Generation (Added Feb 14)

- **Decision**: The frontend generates a UUID (the `assistantMessageId`) **before** initiating the stream and sends it to the backend. The backend is forced to use this specific ID for the assistant's message.
- **Reasoning**: Eliminates the "Message not found" race condition. Previously, if a user performed an action (Apply/Discard) before the backend had finished saving its auto-generated ID, the action would fail. Matching IDs from the start ensures immediate actionability.

### Cache-Direct Streaming (Added Feb 14)

- **Decision**: Remove local component state for messages. Streamed content is written surgically into the TanStack Query cache (`useConversationDetailsQuery`) in real-time.
- **Reasoning**: Solves the "Vanishing Message" bug when switching chats. Because data lives in the global cache bucket keyed by `conversationId`, switching views and back preserves any paritially streamed content or new messages instantly.

### Navigation & Persistence

- **Decision**: Moved `AIChatBox` into the `RootLayout`.
- **Reasoning**: Enables seamless navigation across resume sections without resetting chat state.

---

## Future Improvements

- **Citation Support**: Parse OpenAI responses to highlight exactly which resume section is being referenced.
- **Vision Integration**: Allow users to share screenshots of their design for visual feedback.
