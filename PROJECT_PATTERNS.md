# Project Architecture & Patterns

This document outlines the standard coding patterns and architectural decisions used in the TailorCV codebase. Follow these patterns to maintain consistency, type safety, and scalability.

## 1. Monorepo Structure

- `apps/backend`: Node.js/Express server (Business logic, Database, AI processing).
- `apps/frontend`: Next.js application (App Router, UI, Server Actions).
- `packages/shared`: Shared types, schemas, and utility functions used by both apps.

---

## 2. Backend Patterns (Express)

### 2.1 Services & Controllers

- **Services**: Responsible for data access (Prisma) and core business logic.
- **Controllers**: Handle HTTP requests, validate input, and call services.
- **Error Handling**: Use standard error types defined in `packages/shared`.

### 2.2 Data Fetching & Parallelization

To minimize latency (especially before streaming), parallelize independent database operations using `Promise.all`.

```typescript
// Pattern: Parallel DB operations
const [conversation, userMessage] = await Promise.all([
  chatService.getConversation(id),
  chatService.saveMessage(userContent),
]);
```

### 2.3 Type Safety

All response and request bodies should be typed in dedicated files (e.g., `src/types/chat-conversations.ts`) to ensure consistency.

---

## 3. Frontend Patterns (Next.js)

### 3.1 Data Fetching (Queries)

Use **React Query** for all GET requests. Use the `defineQuery` utility from `lib/http` which wraps `defineGet` from `lib/data`.

- **Location**: `lib/data/` (for base fetchers using `defineGet`) and `lib/http/` (for React Query hooks using `defineQuery`).
- **Hook Pattern**: `use[Entity]Query`


```typescript
// lib/http/chat-client.ts
export const useConversationsQuery = defineQuery<void, Conversation[]>({
  path: 'ai/chat/conversations',
  key: 'chat-conversations',
});
```

### 3.2 Mutations (Server Actions)

Never use direct `fetch` for mutations (POST, DELETE, PATCH). Use **Server Actions** created via the `defineAction` utility.

- **Location**: `lib/actions/` (e.g., `ai-chat.actions.ts`)
- **Action Pattern**: `[actionName]Action`

```typescript
// lib/actions/chat.actions.ts
export const createConversationAction = defineAction<Input, Output>({
  method: 'POST',
  path: 'ai/chat/conversations',
  auth: 'required',
  keyPrefix: 'chat-conversations', // Auto-invalidates React Query keys
});
```

### 3.3 Mutation Handling (useActionMutation)

Use the `useActionMutation` hook in components to handle Server Actions. It provides:

- Automatic error toast notifications.
- Success toast notifications.
- TypeScript inference for input/output.
- Form error mapping (if using `react-hook-form`).

```typescript
const { mutate } = useActionMutation(createConversationAction, {
  onSuccess: (data) => {
    // Immediate local state update
  },
  showErrorToast: true,
  successMessage: 'Created successfully',
});
```

### 3.4 API Routes (Proxies)

Next.js API routes (`app/api/...`) should only be used as proxies for GET requests to the backend. This allows client-side React Query hooks to fetch data without exposing backend complexity.

- **Mutations are NOT allowed in API routes**; use Server Actions instead.

### 3.5 Real-time Streaming (SSE)

For Server-Sent Events (SSE), use a dedicated API Route (`app/api/.../route.ts`) that proxies the request to the backend.

- **Architecture**:
    1. **DAL**: Create a helper in `lib/data/` (e.g., `lib/data/ai-chat.ts`) using `backendStream`.
    2. **Proxy**: In `route.ts`, call the DAL helper and return the raw response with `Content-Type: text/event-stream`.
    3. **Client**: Use `fetchEventSource` in a specialized hook or provider.

```typescript
// app/api/ai/chat/route.ts
import { streamChat } from '@/lib/data/ai-chat';

export async function POST(req: Request) {
  const body = await req.json();
  const response = await streamChat(body); // DAL Call
  return new Response(response.body, { ... });
}
```


### 3.6 Component State

- Use **Context Providers** for complex, globally-relevant features (AI Chat, Current Resume).
- Keep component-specific state local.
- Use **Skeletons** for all loading states.

### 3.7 Type Centralization

- **Shared Types**: In `packages/shared/src/types`.
- **Frontend Types**: In `lib/types/` (e.g., `lib/types/ai-chat.ts`). Avoid local `types.ts` files inside component directories to prevent circular dependencies.

---

## 4. UI/UX Design System

- **Components**: HeroUI (v3 Beta).
- **Icons**: Iconify (`@iconify/react`).
- **Styling**: Vanilla CSS with curated color variables.
- **Feedback**: `sonner` for toasts via `showErrorToast` utility.
