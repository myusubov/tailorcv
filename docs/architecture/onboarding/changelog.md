# Onboarding Changelog

> Chronological implementation history for Onboarding. Add new entries at the top.

---

Older history: [changelog-archive-2026-h1.md](changelog-archive-2026-h1.md) (January-June 2026).

## 2026-11-07

### Idempotency Key Stops Duplicate Resumes

- **Decision:** The analyze request carries an idempotency key made in the browser and stored on the resume; see [ADR 0002](adr/0002-store-idempotency-key-on-the-created-row.md).
- **Problem:** A server action gives up after 15 seconds without cancelling the backend, so a retry after a timeout created a second resume. A double submit could do the same.
- **Solution:**
  1. **Schema — `apps/backend/prisma/schema.prisma`, migration `20261107090000_add_resume_idempotency_key`**: Nullable `Resume.idempotencyKey` with a unique constraint on `(userId, idempotencyKey)`.
  2. **Service — `apps/backend/src/services/resume.service.ts`**: `createResume` looks the key up first and returns that resume's id; otherwise it inserts with the key. A `P2002` from a concurrent insert is caught and answered with the winning resume's id; any other error is rethrown.
  3. **Request — `apps/backend/src/schemas/github.schema.ts`, `apps/backend/src/controllers/github.controller.ts`**: The body requires `idempotencyKey` (a UUID) and the controller passes it to the service.
  4. **Frontend — `apps/frontend/app/components/onboarding/github/github-step.tsx`, `apps/frontend/lib/types/github.ts`**: One ref holds the key and the last selected repository ids. The same set of ids reuses the key; any other selection gets a new one.
- **Outcome:** Checked by hand against the Neon database with a temporary 20-second backend delay (since removed): the first click timed out, the second click returned the same resume id, and the table gained one row. The `P2002` branch has never run, a replay does not compare the repository ids stored on the resume, and no test, lint or typecheck was run. Rows created before this change have a null key. The Redis `idempotency()` middleware is not used for this route.

## 2026-11-06

### GitHub Analyze Creates a Resume and Redirects

- **Problem:** Analyze waited for the whole repository analysis and showed nothing from it except a warning toast; the resume story needs the resume to exist first and the user to land on it. Errors from the call were also not mapped to what the user can do next.
- **Solution:**
  1. **Success — `apps/frontend/app/components/onboarding/github/github-step.tsx`**: `onSuccess` pushes `/resumes/{id}` (`ROUTES.RESUMES` from `apps/frontend/lib/config/constants.ts`). The `failedRepoIds` warning toast was removed because the response no longer carries it.
  2. **Contract — `apps/frontend/lib/types/github.ts`, `packages/shared/src/types/resume.ts`**: `AnalyzeGithubReposOutput` is `CreateResumeResponse` (`{ id }`).
  3. **Errors — same component**: `GITHUB_CONNECTION_REQUIRED` keeps the reconnect page; `UNAUTHORIZED` shows no toast because the query provider redirects (see the auth changelog); `VALIDATION_ERROR` and `BAD_REQUEST` show the generic `INTERNAL_ERROR` message because the global validation text talks about a form; `RATE_LIMIT_EXCEEDED` keeps its 10-second toast; everything else uses the shared toast. No Retry button, because the picker and the Analyze button stay on screen.
  4. **Messages — `apps/frontend/lib/utils/error-toast.tsx`**: Friendly messages for `USER_NOT_FOUND` and `INVALID_RESPONSE`; `NETWORK_ERROR` no longer tells the user to check their internet, because it is also raised when the Next server cannot reach the backend.
  5. **Timeouts — `apps/frontend/lib/actions/_action.ts`, `apps/frontend/lib/api/client.ts`**: `defineAction` passes a 15-second `timeoutMs` to `backendRequest`, whose abort resolves as `NETWORK_ERROR`.
  6. **Reads — `apps/frontend/lib/http/`**: `clientGet` returns `NETWORK_ERROR` and `INVALID_RESPONSE` results instead of throwing or returning `null`, queries pass the TanStack `signal` through for cancellation, and the repositories query retries once only for status 500 and above.
- **Outcome:** Analyze creates a resume and navigates to `/resumes/{id}`, which has no page yet. A server action no longer waits on the backend indefinitely. With the browser offline, the Analyze button was seen to stay pending with no request in the Network tab; this is unresolved and was not reproduced in a production build. No component test covers the new error handling, and no test, lint or typecheck result is recorded.

### Onboarding Gate Moves to a Server Layout

- **Problem:** The Clerk middleware decided the onboarding redirect by fetching `/api/onboarding/status` for every protected request and checking whether a base resume existed.
- **Solution:**
  1. **Status — `apps/backend/src/services/onboarding.service.ts`, `controllers/onboarding.controller.ts`, `types/onboarding.ts`**: `GET /api/v1/onboarding/status` returns `{ onboardingCompletedAt }` read from `User`, `null` when not completed or no user row exists.
  2. **Gate — `apps/frontend/app/onboarding/layout.tsx`, `apps/frontend/lib/auth/guards.ts`**: The layout calls `requireNotOnboardedUser`, which redirects completed users to `/resumes`, redirects to sign-in on a 401 from the status call, and throws on any other failure or an invalid status body.
  3. **Removed — `apps/frontend/app/api/onboarding/status/route.ts`**: The Next route handler used by the middleware was deleted.
  4. **Schema and types — `apps/frontend/lib/schemas/onboarding.ts`, `apps/frontend/lib/types/onboarding.ts`**: `onboardingStatusSchema` validates the status body.
- **Outcome:** Onboarding access is decided by a server layout instead of the middleware. Nothing sets `onboardingCompletedAt` yet, so every user is treated as not onboarded. `guards.test.ts` covers the guards; it was not run.

### Resume Data Model Rewrite

- **Decision:** A user's profile and each resume are separate row sets, and a resume owns copies of the profile data; see [ADR 0001](adr/0001-copy-profile-data-into-each-resume.md).
- **Problem:** `BaseResume` and `CustomizedResume` stored a resume as one JSON column and could not express profile data, a generating state or per-resume sections.
- **Solution:**
  1. **Schema — `apps/backend/prisma/schema.prisma`, migration `20261104125831_resume_rewrite`**: Dropped `base_resumes`, `customized_resumes` and `BaseResumeStatus`. Added `Profile`, `Analysis`, `Resume` (`ResumeStatus`: `GENERATING`, `READY`, `FAILED`), `Contact`, `Project`, `Experience`, `SkillGroup`, `Education`, `Certification`, `Language` and `User.onboardingCompletedAt`. Contact, experience, education, certification and language rows carry a `CHECK` that exactly one of `profileId` and `resumeId` is set.
  2. **Service — `apps/backend/src/services/resume.service.ts`, `apps/backend/src/types/resume.ts`**: `createResume` reads the profile and creates the resume with its copied rows in one nested write. Experiences and educations are ordered newest first with ongoing ones first, certifications by issue date newest first with undated last, languages by their own position; `position` is the index in that order. `sectionOrder` gets the default nine section names; headline, summary, projects and skill groups are left empty.
  3. **Removed — `apps/backend/src/controllers/resumes.controller.ts`, `routes/resumes.router.ts`, `services/resumes.service.ts`, `types/resumes.ts`, the `/resumes` mount**: `schemas/resumes.schema.ts` was emptied and is now a zero-byte file.
- **Outcome:** The backend can create a resume from a profile. The frontend files that targeted the removed `/resumes/base/{id}` endpoints (`app/api/resumes/base/[id]/route.ts`, `lib/data/resume.ts`, `lib/http/resumes-client.ts`, `lib/actions/resumes.actions.ts`) had no callers and were deleted afterwards, along with the emptied `schemas/resumes.schema.ts` and the three resume `*Locals` types in `apps/backend/src/types/locals.ts` that imported it. Nothing creates a `Profile` row yet, so `createResume` copies nothing for a user without one. `createResume` has no test. No migration, test, lint or typecheck result is recorded.

---

## 2026-10-23

### GitHub Step Error and Partial-Failure States

- **Problem:** `GitHubStep` showed one generic error view for repository loading and a default toast for analysis errors, so a revoked or uninstalled app, a suspended app, a rate limit and a partly failed analysis looked the same, and the analyze result was not read at all.
- **Solution:**
  1. **Repository-loading errors — `apps/frontend/app/components/onboarding/github/github-step.tsx`**: `GITHUB_APP_SUSPENDED` shows a full-page `ErrorState` with a back action only (the account owner must unsuspend the app); `GITHUB_CONNECTION_REQUIRED` shows "Reconnect your GitHub account" whose action restarts the installation flow; any other error keeps "Failed to fetch repositories" with a refetch action. The one-use `github-error-view.tsx` was deleted and its `ErrorState` is used directly.
  2. **Analysis errors — same file**: `useActionMutation` for analyze runs with `showErrorToast: false`. `GITHUB_CONNECTION_REQUIRED` renders the same reconnect page; every other error shows the shared error toast, kept for 10 seconds for `RATE_LIMIT_EXCEEDED`.
  3. **Partial failure — same file**: When the analyze response lists `failedRepoIds`, a 10-second warning toast names those repositories by full name.
  4. **Messages — `apps/frontend/lib/utils/error-toast.tsx`**: Friendly messages for `GITHUB_CONNECTION_REQUIRED`, `GITHUB_API_ERROR` and `GITHUB_APP_SUSPENDED`; the rate-limit message comes from the server.
  5. **Types — `apps/frontend/lib/types/github.ts`**: `AnalyzeGithubReposOutput` is now `AnalyzeGithubReposResponse` from `shared`.
- **Outcome:** A required reconnect, a suspended app, a rate limit and a partly failed analysis each get a distinct response. The UI still shows nothing from the analysis itself beyond the warning toast. No component test covers these states, and no test, lint or typecheck result is recorded for this frontend change.

## 2026-09-01

### GitHub Repo Card Selection Indicator and Checkbox Semantics

- **Problem:** The GitHub repo picker card signalled selection mainly through card border/background color plus a checkmark badge that only appeared after selection, so nothing communicated that the list was multi-select before the first click, and the card exposed itself as `role="button"` with `aria-pressed`, which does not read as a multi-select toggle. Cards in a row also varied in height with description length.
- **Solution:**
  1. **Persistent selection control — `apps/frontend/app/components/onboarding/github/github-repo-card.tsx`**: Replaced the conditional `framer-motion` checkmark badge with an always-rendered HeroUI `Checkbox` wrapped in an `inert` span (plus `isReadOnly` to silence the controlled-without-`onChange` warning) so the box is visible in every state, stays out of focus and the accessibility tree, and lets clicks fall through to the card.
  2. **Toggle semantics — same file**: Switched the card from `role="button"` + `aria-pressed` to `role="checkbox"` + `aria-checked`, added a `maxRepos` prop used for a `title` hint on limit-disabled cards, and simplified the selected treatment (dropped the redundant `ring`, added `shadow-sm` and a selected-state hover).
  3. **Equal-height rows — `github-repo-selection-results.tsx`**: Added `auto-rows-fr` to the grid, passed `maxRepos` through, and removed the `framer-motion` grid fade-in wrapper.
  4. **Skeleton parity — `github-repo-grid-skeleton.tsx`**: Added a `size-5` rounded placeholder so the loading card matches the new indicator slot.
- **Outcome:** The repo picker shows a checkbox affordance before any selection, exposes a multi-select toggle to assistive tech, and renders uniform-height cards; `framer-motion` is no longer imported by the card or results components.

## 2026-08-21

### GitHub-Only Method Selection

- **Problem:** `MethodSelection` offered Upload and Manual Entry alongside GitHub import, but onboarding is narrowing to a GitHub-only critical path.
- **Solution:**
  1. **`apps/frontend/app/components/onboarding/method-selection.tsx`**: Commented out the Upload and Manual Entry method cards, updated the intro copy to "master resume," and centered the single remaining GitHub card.
  2. Left `apps/frontend/app/onboarding/page.tsx` unchanged: `upload` and `manual` remain valid `?method=` values, so both flows stay reachable directly and their components stay in the codebase.
  3. Minor spacing cleanup in `github-repo-selection-actions.tsx`, `github-repo-selection-results.tsx`, and `github-repo-selection-toolbar.tsx`.
- **Outcome:** New users only see GitHub import as a choice; Upload and Manual Entry are dormant but not deleted, preserving the existing tested implementations for a possible future re-introduction.

## 2026-08-19

### Installation-Scoped GitHub Repository Picker

- **Problem:** The GitHub picker assumed a user OAuth connection with account identity fields and a bare repository array, while the backend now connects through GitHub App installations and returns installation repository metadata.
- **Solution:**
  1. Updated `apps/frontend/lib/types/github.ts` and `github-repo-selection-view.tsx` to consume `FetchGithubReposResponse`, using `repositories` for filtering and `total_count` for the displayed repository count.
  2. Removed the connected-account identity display from `github-repo-selection-header.tsx` because the client-safe GitHub connection response no longer contains user-profile fields.
  3. Kept the existing Analyze UI handoff in `github-step.tsx`; its temporary backend endpoint now returns an empty response while project-structure analysis is paused.
- **Outcome:** GitHub onboarding renders the repositories available to the installed App without relying on retired OAuth profile fields, while preserving the existing selection workflow.

## 2026-08-04

### HeroUI 3.2 Current-Item Checkboxes

- **Problem:** Education, experience, and project item forms still used HeroUI's beta-era Checkbox sibling composition, which no longer matches the 3.2.3 compound-component contract.
- **Solution:**
  1. **Current Checkbox structure — `education-item-content.tsx`, `experience-item-content.tsx`, and `project-item-content.tsx`**: Moves each `Checkbox.Control` inside `Checkbox.Content` while preserving controlled values and end-date clearing.
  2. **Behavior-focused mocks and coverage — `experience-item-content.test.tsx` and `project-item-content.test.tsx`**: Makes the Checkbox mock expose a real accessible checkbox and proves selecting the current-item option clears the saved end date.
- **Outcome:** Manual-entry current-item controls target HeroUI 3.2.3 while retaining their form-state behavior and accessible visible labels.

## 2026-08-03

### Global Loading Test Alignment

- **Problem:** The `GlobalLoading` regression test mocked HeroUI without the hydration hook used by the component and still expected the previous arbitrary z-index class, causing the frontend suite to fail before exercising the portal behavior.
- **Solution:**
  1. **Hydration boundary mock — `apps/frontend/app/components/ui/global-loading.test.tsx`**: Added a deterministic `useIsHydrated()` mock so the test renders the client-only portal state.
  2. **Current class contract — `apps/frontend/app/components/ui/global-loading.test.tsx`**: Updated the assertion to the component's native `z-100` utility while preserving its accessibility, portal, and scroll-lock checks.
- **Outcome:** The focused test exercises the implemented hydrated loading overlay contract instead of failing on stale test infrastructure.

## 2026-07-17

### Minimal Global Loading Overlay

- **Decision:** Use one reusable body-level loading portal for blocking page prerequisites while preserving progressive skeletons for structured repository data.
- **Problem:** The initial GitHub connection check used a feature-specific skeleton constrained by the onboarding layout, so it could not reliably cover the viewport or be reused by other application flows.
- **Solution:**
  1. **Reusable portal:** Added `apps/frontend/app/components/ui/global-loading.tsx` with customizable status copy, hydration-safe `document.body` portal placement, accessible status semantics, and body-scroll restoration.
  2. **GitHub connection state:** Updated `apps/frontend/app/components/onboarding/github/github-step.tsx` to render `GlobalLoading` only while `isLoadingConnection` is true, and removed the obsolete `github-loading-view.tsx` without changing progressive repository-grid loading.
  3. **Focused regression coverage:** Added `apps/frontend/app/components/ui/global-loading.test.tsx` to verify portal ownership, custom copy, status attributes, and scroll cleanup.
- **Outcome:** Blocking application work can present a minimal full-viewport loading state that escapes local layout boundaries, while GitHub repository results continue loading progressively in place.

## 2026-07-03

### GitHub Repo Results Internal Scroll

- **Decision:** Make the GitHub repo picker use a bounded flex shell where only the repository results region scrolls.
- **Problem:** Large GitHub repository lists pushed the Analyze/Back actions below the fold, and applying scroll behavior directly to the results component did not work because its parent chain did not provide a bounded flex height.
- **Solution:**
  1. **Bounded shell:** Updated `apps/frontend/app/components/onboarding/github/github-repo-selection-view.tsx` to give the GitHub picker a `100dvh`-based height with its own vertical padding.
  2. **Flex parent chain:** Made the animated picker wrapper a `flex` column with `min-h-0`, `flex-1`, and `overflow-hidden` so child regions can shrink correctly.
  3. **Scrollable results:** Updated `apps/frontend/app/components/onboarding/github/github-repo-selection-results.tsx` to use `flex-1`, `min-h-0`, and `overflow-y-auto` for the repo list area.
  4. **Persistent footer:** Updated `apps/frontend/app/components/onboarding/github/github-repo-selection-actions.tsx` so the action row does not shrink into the scrollable list.
- **Outcome:** Long GitHub repo lists now scroll inside the results region while the header/search controls and action row remain available in the picker layout.

## 2026-07-03

### GitHub Animated Shell Horizontal Padding

- **Decision:** Move onboarding layout padding from the route `main` element onto the keyed animated content shell, with GitHub mode using no horizontal route padding.
- **Problem:** The shared onboarding page wrapper applied `px-4 sm:px-6` to every method, which made the GitHub repo picker unsuitable for an internal scroll layout because the eventual repo-list scrollbar would be inset by the global page padding. Switching the wrapper class directly from selected method state also caused the outgoing method-selection view to lose padding during its exit animation.
- **Solution:**
  1. **Neutral route landmark:** Updated `apps/frontend/app/onboarding/page.tsx` so `main` no longer owns the centered padded shell.
  2. **Animated layout shell:** Applied the mode-specific shell class to the keyed `motion.div`, allowing the exiting screen to retain its own layout while the entering GitHub screen receives `mx-auto max-w-6xl`.
  3. **Normal-flow preservation:** Retained `mx-auto max-w-6xl px-4 py-8 sm:px-6` for method selection, upload, and manual entry views.
- **Outcome:** The GitHub path can own horizontal spacing inside its feature layout without inheriting global page padding, while animated transitions no longer remove padding from the outgoing onboarding screen.
