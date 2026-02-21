# Conflict Resolution Plan: Merge `dev` into `feature/ai-edit`

## Overview
Resolving a large merge (46+ commits) from `dev` into `feature/ai-edit`. There are significant overlaps in AI chat logic and onboarding features.

## Phase 1: Foundation & Shared Schemas
- [ ] **Shared Schemas**: `packages/shared/src/schemas/resume.ts`
- [ ] **Infrastructure**: `apps/backend/prisma/schema.prisma`
- [ ] **Package Files**: `package.json`, `apps/backend/package.json`, `apps/frontend/package.json`
- [ ] **Config/Docs**: `AI_CHAT_REVIEW_NOTES.md`, `ARCHITECTURE.md`, `PROJECT_PATTERNS.md`, `docs/adr/001-ai-chat-feature.md`, `docs/adr/002-fault-tolerance-strategy.md`

## Phase 2: Backend Logic
- [ ] **Backend Types**: `apps/backend/src/types/ai-chat.ts`, `apps/backend/src/types/chat-conversations.ts`
- [ ] **Backend Services**: `apps/backend/src/services/ai-chat.service.ts`, `apps/backend/src/services/chat-conversations.service.ts`
- [ ] **Backend Utils**: `apps/backend/src/utils/ai-intent.ts`, `apps/backend/src/utils/ai-prompts.ts`
- [ ] **Backend Controllers/Routes**: `apps/backend/src/controllers/ai-chat.controller.ts`, `apps/backend/src/routes/index.ts`

## Phase 3: Frontend Foundations
- [ ] **Frontend Types**: `apps/frontend/lib/types/ai-chat.ts`, `apps/frontend/lib/types/resumes.ts`
- [ ] **Frontend Hooks/Actions**: `apps/frontend/lib/actions/ai-chat.actions.ts`, `apps/frontend/lib/hooks/use-query-cache.ts`, `apps/frontend/lib/http/ai-chat-client.ts`, `apps/frontend/lib/http/define-query.ts`
- [ ] **Frontend Providers**: `apps/frontend/app/providers/ai-chat-provider.tsx`

## Phase 4: Frontend UI Components
- [ ] **Layouts/Pages**: `apps/frontend/app/resumes/[id]/review/page.tsx`, `apps/frontend/app/(auth)/register/page.tsx`
- [ ] **Review Components**: `ai-chat-box.tsx`, `chat-sidebar.tsx`, `resume-form-context.tsx`, etc.
- [ ] **Onboarding Components**: `github-connect-view.tsx`, `experience-item-content.tsx`, etc.

## Verification
- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `npm test`
