# TailorCV

> AI-powered resume tailoring platform. Monorepo with Express backend, Next.js frontend, and shared type package.

## Non-Negotiable Work Gate

Before any code implementation:

- Read `docs/architecture/README.md`.
- Read the relevant domain doc if one exists.
- If no relevant domain doc exists, create/update one before the work is considered complete.

After any source/config change under `apps/`, `packages/`, or root project config:

- Update the relevant `docs/architecture` doc and dev log in the same work session.
- Do not claim completion, commit, or open a PR until the architecture docs are current.

## Tech Stack

| Layer         | Technology                         | Version                     |
| ------------- | ---------------------------------- | --------------------------- |
| Runtime       | Node.js                            | 20.x                        |
| Frontend      | Next.js (App Router)               | 16.x                        |
| Backend       | Express.js                         | 4.x                         |
| Database      | PostgreSQL + Prisma                | Prisma 7.x                  |
| Auth          | Clerk                              | v7 (frontend), v1 (backend) |
| UI            | HeroUI v3 Beta + Tailwind CSS 4    | -                           |
| Icons         | Iconify (`@iconify/react`)         | -                           |
| AI            | OpenAI (Responses API) + Anthropic | -                           |
| Queue         | BullMQ + Redis                     | -                           |
| Validation    | Zod 4                              | -                           |
| Data Fetching | TanStack React Query v5            | -                           |
| Forms         | react-hook-form + Zod              | -                           |
| Toasts        | sonner                             | -                           |
| Resilience    | cockatiel                          | -                           |

## Project Structure

```
tailorcv/
├── apps/backend/          # Express API server (services, controllers, routes, workers)
├── apps/frontend/         # Next.js app (App Router, Server Actions, React Query)
├── packages/shared/       # Shared types, Zod schemas, utilities
└── docs/architecture/     # Architecture documentation (domain docs)
```

## Commands

```bash
# Development (both apps)
npm run dev

# Development (individual)
npm run dev:frontend
npm run dev:backend

# Build
npm run build

# Lint
npm run lint

# Typecheck
npx tsc --noEmit              # from app directory
npm run build -w shared        # shared must build first
npm run typecheck:frontend     # from repo root
npm run typecheck:backend      # from repo root

# Test
npm run test
npm run test:frontend
npm run test:backend
npm run test:e2e:frontend
npm run test:e2e:frontend:headed
npm run test:e2e:frontend:real-auth

# Format
npm run format

# Prisma
npm run prisma:generate        # generate client
npm run prisma:migrate         # run migrations
npm run prisma:studio          # visual DB browser
```

## Planning Convention

- Use chat-based planning and the platform's plan mode by default for multi-step work.
- Do not create a repo-local `PLAN.md` unless a human explicitly asks for a file-based plan artifact.
- When a reusable implementation pattern changes, update this `CLAUDE.md`; when feature architecture changes, update the relevant doc under `docs/architecture/`.

---

## Code Patterns

### Pattern: Defining a Backend Route

**When:** Adding any new API endpoint
**Canonical example:** `apps/backend/src/routes/ai-chat.router.ts`

```typescript
// 1. Router file: {entity}.router.ts
export const entityRouter = Router();
entityRouter.get('/', rateLimiter, requireClerkAuth, listEntitiesController);
entityRouter.post('/', rateLimiter, requireClerkAuth, createEntityController);

// 2. Mount in routes/index.ts
router.use('/entity', entityRouter);
```

**Key rules:**

- Always apply `requireClerkAuth` middleware (except health/webhooks)
- Apply rate limiter middleware per route group
- Use `idempotency()` middleware for POST endpoints that trigger async/streaming work
- Controller functions follow naming: `{verb}{Entity}Controller`

---

### Pattern: Backend Controller + Service

**When:** Implementing business logic for an endpoint
**Canonical example:** `apps/backend/src/controllers/chat-conversations.controller.ts` + `apps/backend/src/services/chat-conversations.service.ts`

```typescript
// Controller: extract locals, call service, return response
export const listEntitiesController = async (
  req: Request,
  res: Response<unknown, ClerkLocals>,
  next: NextFunction,
) => {
  try {
    const { clerkUserId } = res.locals;
    const data = await listEntities({ clerkUserId });
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

// Service: typed input object, Prisma queries, throw AppError
export async function listEntities(input: ListEntitiesInput) {
  return prisma.entity.findMany({
    where: { userId: input.clerkUserId },
    select: { id: true, title: true },
    orderBy: { updatedAt: 'desc' },
  });
}
```

**Key rules:**

- Services use single object parameter with a dedicated input type
- Controllers NEVER access Prisma directly -- always go through services
- Parallelize independent DB operations with `Promise.all`
- Throw `AppError` with `ErrorCode` enum from shared package for operational failures

---

### Pattern: Frontend Data Fetching (React Query)

**When:** Adding a GET request to display data from the backend
**Canonical example:** `apps/frontend/lib/http/ai-chat-client.ts`

```typescript
// 1. Define query hook in lib/http/{entity}-client.ts
export const useEntitiesQuery = defineQuery<void, Entity[]>({
  path: '/api/entity',
  keyPrefix: 'entities',
  queryDefaults: { staleTime: 1000 * 60 * 5 },
});

// With dynamic params:
export const useEntityDetailsQuery = defineQuery<{ id: string }, EntityDetails>(
  {
    path: ({ id }) => `/api/entity/${id}`,
    keyPrefix: 'entity-details',
    dynamicParts: ({ id }) => [id],
  },
);
```

**Key rules:**

- All GET requests use `defineQuery` -- never raw `fetch` or `useQuery`
- Query hooks go in `lib/http/`, DAL fetchers in `lib/data/`
- API routes (`app/api/`) are thin GET proxies to the backend -- no mutations
- Types live in `lib/types/{entity}.ts`, not alongside components

---

### Pattern: Frontend Mutations (Server Actions)

**When:** Any create, update, or delete operation
**Canonical example:** `apps/frontend/lib/actions/ai-chat.actions.ts`

```typescript
// 1. Define action in lib/actions/{entity}.actions.ts
'use server';
import { defineAction } from './_action';

export const createEntityAction = defineAction<CreateInput, CreateOutput>({
  method: 'POST',
  path: 'entity',
  keyPrefix: 'entities', // auto-revalidates this cache tag
  revalidate: { fromKey: false },
});

// With dynamic path:
export const deleteEntityAction = defineAction<{ id: string }, null>({
  method: 'DELETE',
  path: ({ id }) => `entity/${id}`,
  keyPrefix: 'entities',
  revalidate: { fromKey: false },
});
```

**Key rules:**

- NEVER use `fetch` for mutations -- always `defineAction` + `useActionMutation`
- Mutations are NEVER allowed in API routes -- Server Actions only
- `keyPrefix` auto-revalidates the matching React Query cache

---

### Pattern: Mutation Handling in Components

**When:** Calling a Server Action from a component
**Canonical example:** `apps/frontend/lib/hooks/use-action-mutation.ts`

```typescript
const { mutate } = useActionMutation(createEntityAction, {
  onSuccess: (data) => {
    /* optimistic cache update */
  },
  showErrorToast: true,
  successMessage: 'Created successfully',
  form: formInstance, // optional: auto-maps validation errors to fields
});
```

**Key rules:**

- Always use `useActionMutation` -- never raw `useMutation` with server actions
- Use `useQueryCache` hook for cache manipulation instead of scattered `setQueryData`

---

### Pattern: SSE Streaming

**When:** Real-time server-sent events (AI chat, job progress)
**Canonical example:** `apps/frontend/app/api/ai/chat/route.ts` (proxy) + `apps/backend/src/controllers/ai-chat.controller.ts` (SSE emitter)

```typescript
// Backend: use SSE utilities
initSseResponse(res);
writeSseEvent(res, { type: 'text', content: chunk });
writeSseEvent(res, { type: 'done' });
setupStreamTermination(res, cleanup);

// Frontend proxy: pipe backend stream through Next.js API route
const response = await streamChat(body);
return new Response(response.body, {
  headers: { 'Content-Type': 'text/event-stream' },
});

// Client: use @microsoft/fetch-event-source, write chunks to TanStack Query cache
```

**Key rules:**

- Write streamed data directly into React Query cache (cache-direct pattern) -- no `useState` for message history
- SSE event types: `text`, `proposal`, `done`, `error`, `thinking`
- Client generates `assistantMessageId` UUID -- backend respects client-provided IDs

---

### Pattern: Error Handling

**When:** Handling errors across the stack

```typescript
// Backend: throw AppError with ErrorCode enum
throw new AppError({
  message: 'Conversation not found',
  errorCode: ErrorCode.NOT_FOUND,
  statusCode: 404,
});

// Frontend: showErrorToast() for manual errors, useActionMutation handles auto
showErrorToast(error);
```

**Key rules:**

- Backend has a global error handler middleware that catches `AppError`, `ZodError`, Prisma errors, and cockatiel resilience errors
- All API responses follow: `{ success: boolean, data?, error?: { message, code, details }, meta: { timestamp, requestId } }`
- `ErrorCode` enum lives in `packages/shared` -- use it everywhere

---

### Pattern: Frontend Flow Controllers

**When:** Building or refactoring stateful frontend flows such as auth, onboarding, or multi-step forms
**Canonical examples:** `apps/frontend/app/components/auth/register/use-register-flow.ts`, `apps/frontend/app/components/auth/login/use-login-flow.ts`

```typescript
// Route or container component: thin orchestration only
export default function FeaturePage() {
  const flow = useFeatureFlow();

  if (flow.mode === 'verification') {
    return <VerificationView {...flow.verificationViewProps} />;
  }

  return <FeatureFormView {...flow.formViewProps} />;
}

// Flow hook: owns RHF, async handlers, routing, and state transitions
export function useFeatureFlow(): UseFeatureFlowResult {
  const form = useForm<FormValues>({ /* ... */ });
  const [globalError, setGlobalError] = useState('');

  const handleSubmit = form.handleSubmit(async (values) => {
    // async orchestration lives here
  });

  return {
    mode: 'form',
    formViewProps: {
      control: form.control,
      onSubmit: handleSubmit,
      globalError,
    },
  };
}
```

**Key rules:**

- Route components and top-level feature containers should stay thin and only choose which view to render.
- Flow hooks own `react-hook-form`, async orchestration, router/search-param handling, and state-machine transitions.
- When a container would pass several values from the same flow hook into one view, return a grouped view-props object from the hook (for example `formViewProps` or `verificationViewProps`) and spread that object intentionally into the matching view.
- Do not spread an entire flow hook result into a view; expose only the render-safe props for that specific view so internals stay private and prop changes remain localized.
- Presentational view components receive render-safe props only -- no Clerk resources, router instances, or search-param objects.
- Keep flow hooks feature-local inside the same directory as the views they coordinate.
- Add focused colocated Vitest files for the flow hook and thin controller boundary when behavior is stateful enough to regress.

---

### Pattern: Type Placement

**When:** Adding or refactoring TypeScript types, interfaces, or result models
**Canonical examples:** auth flow hooks, E2E helpers, and query/action modules

**Key rules:**

- Keep private single-file types colocated with the function or module that uses them unless a more specific frontend rule applies.
- Frontend shared UI/domain types follow the existing frontend rule: place them under `lib/types/`, never inside component directories.
- Move non-UI helper or module types into a sibling `types.ts` or `*.types.ts` file only when they are reused across multiple files or form part of an exported contract.
- Prefer separating pure decision/result models from browser-automation or side-effectful helpers when a file starts mixing both concerns heavily.
- Do not extract types into separate files by default if they are only used once; unnecessary type splitting harms readability more than it helps.

---

## Key Utilities & Shared Functions

| Utility                             | Location                                         | Purpose                                                        |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `defineQuery`                       | `apps/frontend/lib/http/define-query.ts`         | Wraps React Query for GET requests                             |
| `defineAction`                      | `apps/frontend/lib/actions/_action.ts`           | Wraps Server Actions for mutations                             |
| `useActionMutation`                 | `apps/frontend/lib/hooks/use-action-mutation.ts` | Centralized mutation handler with toasts + form errors         |
| `useQueryCache`                     | `apps/frontend/lib/hooks/use-query-cache.ts`     | Cache operations (setData, list.add/remove/update, invalidate) |
| `backendRequest`                    | `apps/frontend/lib/api/index.ts`                 | Server-only HTTP client to backend                             |
| `backendStream`                     | `apps/frontend/lib/api/index.ts`                 | Server-only streaming client to backend                        |
| `defineGet`                         | `apps/frontend/lib/data/`                        | Server-only data fetcher (used by defineQuery)                 |
| `successResponse`                   | `apps/backend/src/utils/response.ts`             | Standardized success response wrapper                          |
| `AppError`                          | `apps/backend/src/utils/AppError.ts`             | Typed error class with ErrorCode                               |
| `initSseResponse` / `writeSseEvent` | `apps/backend/src/utils/ai-stream-sse.ts`        | SSE utilities for streaming                                    |
| `showErrorToast`                    | `apps/frontend/lib/utils/error-toast.ts`         | Sonner toast for API errors                                    |
| `deepMerge`                         | `packages/shared/src/utils/deepMerge.ts`         | Deep object merge                                              |

## Cross-Project Workflows

### Adding a New CRUD Endpoint (Backend -> Frontend)

1. **Shared:** Add/update types in `packages/shared/src/types/` if needed
2. **Backend:** Create input types in `src/types/{entity}.ts`
3. **Backend:** Create service in `src/services/{entity}.service.ts`
4. **Backend:** Create controller in `src/controllers/{entity}.controller.ts`
5. **Backend:** Create router in `src/routes/{entity}.router.ts`, mount in `routes/index.ts`
6. **Backend:** Add Zod validation schema in `src/schemas/` if needed
7. **Frontend:** Create proxy API route in `app/api/{entity}/route.ts` (GET only)
8. **Frontend:** Create DAL fetcher in `lib/data/{entity}.ts`
9. **Frontend:** Create query hook in `lib/http/{entity}-client.ts`
10. **Frontend:** Create server actions in `lib/actions/{entity}.actions.ts`
11. **Frontend:** Add frontend types in `lib/types/{entity}.ts`
12. **Verify:** Run `npx tsc --noEmit` in both apps

## Naming Conventions

| Thing                    | Convention                              | Example                         |
| ------------------------ | --------------------------------------- | ------------------------------- |
| Backend controllers      | `{verb}{Entity}Controller`              | `listConversationsController`   |
| Backend services         | `{verb}{Entity}`                        | `createConversation`            |
| Backend routes           | `{entity}Router`                        | `aiChatRouter`                  |
| Backend route files      | `{entity}.router.ts`                    | `ai-chat.router.ts`             |
| Backend controller files | `{entity}.controller.ts`                | `ai-chat.controller.ts`         |
| Backend service files    | `{entity}.service.ts`                   | `chat-conversations.service.ts` |
| Backend type files       | `{entity}.ts` in `src/types/`           | `ai-chat.ts`                    |
| Frontend query hooks     | `use{Entity}Query`                      | `useConversationsQuery`         |
| Frontend cache hooks     | `use{Entity}Cache`                      | `useConversationsCache`         |
| Frontend actions         | `{verb}{Entity}Action`                  | `createConversationAction`      |
| Frontend action files    | `{entity}.actions.ts`                   | `ai-chat.actions.ts`            |
| Frontend type files      | `{entity}.ts` in `lib/types/`           | `ai-chat.ts`                    |
| Components               | PascalCase, feature-grouped             | `ChatSidebar`, `OnboardingForm` |
| Hooks                    | `use-{name}.ts` (kebab-case file)       | `use-action-mutation.ts`        |
| Feature flow hooks       | `use-{feature}-flow.ts`                 | `use-login-flow.ts`             |
| Frontend colocated tests | `{name}.test.ts(x)` beside feature code | `use-login-flow.test.tsx`       |
| API routes               | kebab-case paths                        | `/api/ai/chat/conversations`    |

## Project-Specific Rules

- Never import from `@tanstack/react-query` directly for data fetching -- use `defineQuery` / `defineAction` / `useActionMutation`
- Never use `useState` for streamed data -- write directly to React Query cache (cache-direct pattern)
- Always use `@iconify/react` for icons -- no other icon libraries
- All interactive elements must have `aria-label` or semantic roles (HeroUI handles most)
- Backend types for request/response bodies go in `src/types/`, not inline
- Frontend types go in `lib/types/`, never in component directories
- Server-only code must use `import 'server-only'` or `'use server'` directive
- `ErrorCode` enum from shared package is the single source of truth for error codes

## Compounding Corrections

- Do not add or update tests for purely presentational copy, layout, count-display, or static text changes unless the behavior is critical, regression-prone, or protects an accessibility, validation, state-transition, persistence, async-flow, cache, or error-handling contract.
- Prefer tests that prove meaningful user-observable behavior: form state changes, validation, submission, reordering, persistence, cache updates, async flow, error handling, or accessibility-critical interactions.
- Before adding a new test file or broad UI assertions, confirm the test would catch a meaningful bug that users or developers would care about. If it only asserts static text exists, do not add it by default.
