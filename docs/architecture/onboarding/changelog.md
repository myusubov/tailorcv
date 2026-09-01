# Onboarding Changelog

> Chronological implementation history for Onboarding. Add new entries at the top.

---

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

## 2026-05-09

### Temporary GitHub Analyze Submit

- **Decision:** Connect the GitHub repo picker Analyze action to the temporary backend analysis endpoint.
- **Problem:** GitHub Analyze still only showed a placeholder toast, so the new backend project-structure analyzer could not be tested from the onboarding UI.
- **Solution:**
  1. **Server action:** Added `apps/frontend/lib/actions/github.actions.ts` for `POST auth/github/analyze`.
  2. **Mutation wiring:** Updated `apps/frontend/app/components/onboarding/github/github-step.tsx` to call `analyzeGithubReposAction` with selected repo IDs and use the existing loading state prop.
- **Outcome:** The onboarding GitHub repo picker can now trigger live project-structure summary logging while the final resume generation pipeline remains unimplemented.

## 2026-05-05

### Progressive GitHub Repository Loading

- **Decision:** Render the GitHub repo picker shell as soon as the connection is known, and skeleton-load only repo-dependent content while repositories fetch.
- **Problem:** Repository loading still blocked the search, selected count, Back, Analyze, and connected-account UI even though the connection data was already available.
- **Solution:**
  1. **Progressive flow:** Updated `apps/frontend/app/components/onboarding/github/github-step.tsx` to render `GitHubRepoSelectionView` during repository loading with an empty repo list and `isReposLoading`.
  2. **Partial skeleton state:** Updated `github-repo-selection-view.tsx` and `github-repo-selection-header.tsx` so only the repository count and grid skeleton while search/actions remain visible.
  3. **Shared grid skeleton:** Added `github-repo-grid-skeleton.tsx` and reused it from `github-loading-view.tsx` to keep skeleton card shape consistent.
- **Outcome:** Users see the connected account, search field, selected count, and actions earlier while repositories continue loading in the grid area.

## 2026-05-05

### GitHub Repo Search URL State

- **Decision:** Persist GitHub repo search text in the onboarding URL as `q` using `nuqs`.
- **Problem:** Repository search was held only in component state, so refreshing the page or sharing the current onboarding URL lost the active filter.
- **Solution:**
  1. **URL-backed search state:** Updated `apps/frontend/app/components/onboarding/github/github-repo-selection-view.tsx` to replace local search text state with `useQueryState('q', parseAsString.withDefault(''))`.
  2. **History control:** Configured the `q` parameter with replace-history and shallow routing so typing in the search bar updates the URL without adding a browser-history entry per keypress.
  3. **Documentation update:** Updated this doc's key file description for the GitHub repo picker.
- **Outcome:** The GitHub repo search field now survives refreshes and restores from URLs while preserving existing search filtering and selection behavior.

## 2026-05-04

### GitHub Repo Picker Modularization

- **Decision:** Keep GitHub repo selection behavior in `github-repo-selection-view.tsx`, but move each visual region into focused feature-local components.
- **Problem:** The repo picker mixed account header, search/status controls, repository cards, empty state, and action footer in one file, making UI changes harder to isolate without touching selection logic.
- **Solution:**
  1. **Thin flow container:** Updated `apps/frontend/app/components/onboarding/github/github-repo-selection-view.tsx` to own `selectedRepos`, `searchQuery`, filtering, clear selection, and analyze handoff only.
  2. **Focused render components:** Added `github-repo-selection-header.tsx`, `github-repo-selection-toolbar.tsx`, `github-repo-card.tsx`, `github-repo-selection-empty-state.tsx`, and `github-repo-selection-actions.tsx` under `apps/frontend/app/components/onboarding/github/`.
  3. **Documentation entry points:** Updated this doc's GitHub key files and component tree so future GitHub picker work starts from the correct files.
- **Outcome:** The GitHub repo picker is easier to edit section-by-section while preserving repo search, selection limit, clear selection, empty state, back, and analyze behavior.

## 2026-05-04

### GitHub Loading Skeleton Alignment

- **Decision:** Match the GitHub loading skeleton to the live repository picker layout instead of using the older stacked loading cards.
- **Problem:** The loading state had different width, spacing, card shape, and breakpoints from the actual repo selection UI, causing a visible layout jump when repositories loaded.
- **Solution:**
  1. **Layout parity:** Updated `apps/frontend/app/components/onboarding/github/github-loading-view.tsx` to use the same `max-w-3xl`, header rhythm, toolbar breakpoint, repo grid, and footer action row as the repo picker.
  2. **Card skeleton parity:** Added a private `RepoCardSkeleton` in `github-loading-view.tsx` with the same rounded card shape and internal zones as `github-repo-card.tsx`.
  3. **Documentation entry point:** Added `github-loading-view.tsx` to the GitHub onboarding key files table.
- **Outcome:** GitHub repository loading now transitions into the loaded picker with less visual shift and a closer representation of the final screen.

## 2026-05-04

### Onboarding Generation Reset

- **Decision:** Remove the old onboarding job pipeline while preserving onboarding UI entry points and GitHub connection/repo browsing.
- **Problem:** GitHub, upload, and manual onboarding submits were coupled to job IDs, BullMQ workers, polling, streaming, idempotency headers, and file extraction code that made the next generation rewrite harder to reason about.
- **Solution:**
  1. **Frontend placeholder submits:** Updated `apps/frontend/app/components/onboarding/github/github-step.tsx`, `upload/upload-step.tsx`, and `manual-entry-form.tsx` so Analyze/Generate actions validate/select data and show explicit placeholder toasts instead of calling generation actions.
  2. **Job UI removal:** Updated `apps/frontend/app/onboarding/page.tsx` and onboarding exports, and removed the job provider, job UI, job proxy routes, and job HTTP hooks.
  3. **Backend generation reset:** Updated `apps/backend/src/routes/onboarding.router.ts`, `controllers/onboarding.controller.ts`, and `server.ts` to keep only onboarding status and remove onboarding job/worker/admin queue wiring.
  4. **Database cleanup:** Updated `apps/backend/prisma/schema.prisma` and added a migration to drop `onboarding_jobs` plus its job status/stage enums.
- **Outcome:** Onboarding is now a clean UI/data-capture surface ready for a new generation implementation without the retired job pipeline.

## 2026-05-01

### Experience Card Alignment & Mobile Project Reordering

- **Decision:** Experience cards now follow the same scan pattern as project cards, while project cards expose mobile reorder controls like the other reorderable onboarding entries.
- **Problem:** Experience cards still used the older `Job #n` header, separate current-role checkbox placement, and non-clearable date controls, while project cards lacked small-screen up/down controls for users who cannot access the desktop hover controls.
- **Solution:**
  1. **Experience section polish:** Updated `apps/frontend/app/components/onboarding/steps/experience-step.tsx` to add an `Experience` section header, populated count, calmer empty state, and consistent add-action labels.
  2. **Experience card alignment:** Updated `apps/frontend/app/components/onboarding/steps/experience-item-content.tsx` to use a numeric badge, clearable date pickers, and the current-role checkbox directly under End Date.
  3. **Project mobile controls:** Updated `apps/frontend/app/components/onboarding/steps/projects-step.tsx` and `project-item-content.tsx` to pass and render mobile up/down reorder controls without changing the desktop floating controls.
- **Outcome:** Work experience and project entries now share a consistent card rhythm, and project cards can be reordered on small screens.

## 2026-05-01

### Onboarding Step Component Modularization

- **Decision:** Repeatable onboarding step sections, date clear controls, and technical skills UI now live in focused components instead of being embedded in the step containers.
- **Problem:** `experience-step.tsx` and `projects-step.tsx` mixed section chrome, empty states, add actions, item rendering, and skills UI, making small UI changes harder to review.
- **Solution:**
  1. **Shared section wrapper:** Added `apps/frontend/app/components/onboarding/steps/onboarding-item-section.tsx` and reused it from experience and projects steps.
  2. **Shared date clear control:** Added `apps/frontend/app/components/onboarding/steps/date-clear-button.tsx` and reused it in project and experience date pickers.
  3. **Skills section extraction:** Added `apps/frontend/app/components/onboarding/steps/technical-skills-section.tsx` so `projects-step.tsx` keeps form orchestration separate from skills rendering.
- **Outcome:** Experience and Projects & Skills steps are easier to scan while preserving their existing form state, validation, and navigation behavior.

## 2026-04-30

### Resume Date Picker Full-Date Preservation

- **Decision:** Resume date pickers now preserve full selected dates while still loading legacy year-only and month-only values.
- **Problem:** DatePicker controls rendered day-level calendars, but form handlers truncated selections to `YYYY-MM`, causing selected days to appear to jump back to the first day of the month and making min/max constraints inconsistent.
- **Solution:**
  1. **Shared parsing contract:** Added `apps/frontend/lib/utils/resume-date.ts` to parse `YYYY`, `YYYY-MM`, and `YYYY-MM-DD` values for DatePicker controls and serialize selected dates without dropping the day.
  2. **Onboarding picker alignment:** Updated `apps/frontend/app/components/onboarding/steps/project-item-content.tsx`, `experience-item-content.tsx`, and `education-item-content.tsx` to use the shared parser for values and min/max bounds.
  3. **Review picker alignment:** Updated `apps/frontend/app/components/resumes/review/sections/projects/project-card.tsx`, `experience/experience-card.tsx`, and `education/education-card.tsx` so post-onboarding edits preserve the same date behavior.
  4. **Validation coverage:** Updated `packages/shared/src/schemas/resume.ts` to accept full `YYYY-MM-DD` dates and added focused tests for helper parsing, schema acceptance, and project item DatePicker values.
- **Outcome:** Users can select a specific day without the UI snapping back to day one, while older resume data continues to load safely.

## 2026-04-29

### Skills Clear-All Control

- **Decision:** Technical skills now include a lightweight `Clear all` action only when multiple skill chips are present.
- **Problem:** Removing several skill chips one by one added friction, while adding equivalent bulk deletion to projects or education would be more destructive and require heavier confirmation UI.
- **Solution:**
  1. **Bulk skill removal:** Updated `apps/frontend/app/components/onboarding/steps/projects-step.tsx` to clear the `skills` field through React Hook Form when the `Clear all` action is pressed.
  2. **Scoped visibility:** Updated `apps/frontend/app/components/onboarding/steps/projects-step.tsx` to show the action only when there is more than one skill.
  3. **Regression coverage:** Updated `apps/frontend/app/components/onboarding/steps/projects-step.test.tsx` to verify all skill chips are removed and the clear action disappears.
- **Outcome:** Users can quickly reset a long skill list without introducing risky bulk deletion for richer project or education entries.

## 2026-04-29

### Project Item Header Polish

- **Decision:** Project cards now use a compact numeric badge for item order and keep the `Projects` section label as the primary section heading.
- **Problem:** Rendering `Projects` immediately above `Project #1` repeated the same noun and made the first project card feel visually heavier than the surrounding form.
- **Solution:**
  1. **Muted project badge:** Updated `apps/frontend/app/components/onboarding/steps/project-item-content.tsx` to replace `Project #n` with an accessible number badge.
  2. **Section count:** Updated `apps/frontend/app/components/onboarding/steps/projects-step.tsx` to show a muted populated count such as `2 projects` beside the section heading.
  3. **Regression coverage:** Added `apps/frontend/app/components/onboarding/steps/project-item-content.test.tsx` and updated `apps/frontend/app/components/onboarding/steps/projects-step.test.tsx` to lock the badge and count behavior.
- **Outcome:** Populated project cards are easier to scan without repeating the section name in every card header.

## 2026-04-29

### Projects & Skills Empty State Refresh

- **Decision:** The manual progress step now labels the fourth step as `Projects & Skills`, and the step guidance reads as advisory resume-strengthening copy rather than an unenforced generation requirement.
- **Problem:** The previous guidance referenced `1 experience` inside the Projects step and presented suggestions as pre-generation requirements, while an empty projects list showed only an add button with no contextual empty state.
- **Solution:**
  1. **Progress label alignment:** Updated `apps/frontend/app/onboarding/types.ts` so the progress pill matches the step header copy.
  2. **Advisory checklist copy:** Updated `apps/frontend/app/components/onboarding/steps/projects-step.tsx` to recommend 3 technical skills and 1 detailed project without mentioning experience.
  3. **Projects empty state:** Updated `apps/frontend/app/components/onboarding/steps/projects-step.tsx` to mirror the education empty-state pattern with concise muted guidance and an `Add Project` action.
  4. **Regression coverage:** Updated `apps/frontend/app/components/onboarding/progress-bar.test.tsx` and `apps/frontend/app/components/onboarding/steps/projects-step.test.tsx` to lock the combined label, empty state, and retired experience copy.
- **Outcome:** Users now get consistent Projects & Skills navigation, clearer non-blocking guidance, and a populated empty Projects section instead of a bare action button.

## 2026-04-28

### Education Empty State Cleanup

- **Decision:** The final education step now uses the main step header as the only major heading, keeps the empty state concise, and relies on the generate button for final-step action clarity.
- **Problem:** The previous empty state stacked a second headline with the main `Education` header and always rendered a separate `You're all set!` card, which added visual weight without changing the user's next action.
- **Solution:**
  1. **Concise empty prompt:** Updated `apps/frontend/app/components/onboarding/steps/education-step.tsx` to replace the duplicate empty-state heading with one optional-education support sentence and the existing `Add Education` action.
  2. **Removed redundant completion card:** Updated `apps/frontend/app/components/onboarding/steps/education-step.tsx` to remove the persistent final-step success card and align muted text with `text-muted-foreground`.
  3. **Locked the UI contract:** Added `apps/frontend/app/components/onboarding/steps/education-step.test.tsx` to verify the concise empty state and absence of duplicate completion messaging.
- **Outcome:** Users see a calmer final onboarding step with one clear optional education prompt and an unchanged path to generate their resume.

## 2026-04-27

### Professional Summary Step Simplification

- **Decision:** Keep the professional summary step focused on one writing task and move guidance into the field helper text instead of a separate help panel.
- **Problem:** The previous summary step repeated guidance across the centered header, field description, and help card, making the step feel visually cluttered for a single optional field.
- **Solution:**
  1. **Balanced prompt copy:** Updated `apps/frontend/app/components/onboarding/steps/summary-step.tsx` to use a shorter header description that wraps more cleanly.
  2. **Inline field guidance:** Updated `apps/frontend/app/components/onboarding/steps/summary-step.tsx` to replace the separate help card with concise helper text under the textarea.
  3. **Regression coverage:** Added `apps/frontend/app/components/onboarding/steps/summary-step.test.tsx` to verify the focused prompt and absence of the old help panel.
- **Outcome:** The summary step now presents one clear writing surface with quieter guidance and less competing visual weight.

## 2026-04-27

### Immediate Skill Chip Removal

- **Decision:** Keep technical skills as a simple form-backed chip array, but subscribe the rendered chip list directly to the `skills` field.
- **Problem:** Removing a skill updated React Hook Form state, but the chip list did not visually update until another local state change, making the remove button appear broken.
- **Solution:**
  1. **Field subscription:** Updated `apps/frontend/app/components/onboarding/steps/projects-step.tsx` to render skills from `useWatch({ control, name: 'skills' })` instead of relying on a stale `watch('skills')` snapshot.
  2. **Typed removal handler:** Updated `apps/frontend/app/components/onboarding/steps/projects-step.tsx` to remove skills through a single object-parameter handler and validate the field after removal.
  3. **Regression coverage:** Added `apps/frontend/app/components/onboarding/steps/projects-step.test.tsx` to verify a clicked skill remove control immediately removes that chip while keeping the other skills visible.
- **Outcome:** Technical skill removal now updates the onboarding UI immediately and has focused regression coverage.

## 2026-04-24

### Required Field Legend Cleanup

- **Decision:** Manual entry now explains required fields once near the progress header and avoids repeated optional helper text on contact fields.
- **Problem:** Optional helper text under unstarred contact fields duplicated the required-marker convention and made the helper/error text area feel busier than needed.
- **Solution:**
  1. **Shared required-field legend:** Updated `apps/frontend/app/components/onboarding/manual-entry-form.tsx` to render `Required fields are marked with *` beneath the manual progress header.
  2. **Removed redundant optional labels:** Updated `apps/frontend/app/components/onboarding/steps/contact-step.tsx` to remove `Optional` descriptions from optional contact fields.
- **Outcome:** Users get one clear explanation for required fields while optional contact fields stay visually quieter and reserve helper text space for meaningful guidance or errors.

## 2026-04-24

### Progress Stepper Review Fixes

- **Decision:** Keep the simplified onboarding stepper design, but harden its docs, defensive state handling, and test harness behavior.
- **Problem:** Follow-up review found markdownlint issues in the onboarding doc, motion-only props leaking into native test DOM nodes, and a missing defensive guard around invalid manual step indexes.
- **Solution:**
  1. **Labeled text fences:** Updated `docs/architecture/onboarding/README.md` to mark the architecture tree blocks as `text`.
  2. **Safer motion test mock:** Updated `apps/frontend/app/components/onboarding/progress-bar.test.tsx` to strip motion-only props before rendering mocked `motion.div` and `motion.li`.
  3. **Fail-closed invalid step guard:** Updated `apps/frontend/app/components/onboarding/progress-bar.tsx` to warn and return `null` for invalid step indexes before deriving step text and state.
- **Outcome:** The onboarding progress UI keeps the same visible behavior while avoiding DOM prop pollution, markdownlint noise, and invalid fallback output.

## 2026-04-23

### Compact Desktop Stepper Pills

- **Decision:** Desktop manual-entry progress labels now size to their content and wrap when needed instead of filling the full row equally.
- **Problem:** Equal-width step labels created large empty areas around short labels, making the non-interactive stepper feel visually heavier and more tab-like than intended.
- **Solution:**
  1. **Fit-content desktop pills:** Updated `apps/frontend/app/components/onboarding/progress-bar.tsx` to replace equal `flex-1` step items with `w-fit` content-sized items.
  2. **Responsive wrapping:** Updated `apps/frontend/app/components/onboarding/progress-bar.tsx` to allow the desktop stepper row to wrap naturally with `flex-wrap`.
- **Outcome:** The manual-entry progress indicator now reads as a compact status trail while preserving the mobile summary and non-interactive step semantics.

## 2026-04-23

### Simplified Manual Entry Progress UI

- **Decision:** Manual entry now uses a single progress model per viewport: a non-interactive labeled stepper on larger screens and a compact current-step summary on mobile.
- **Problem:** The previous progress header repeated status as a percentage, progress bar, numeric count, and step labels, which made the manual-entry form feel cluttered without adding useful guidance.
- **Solution:**
  1. **Removed duplicate progress signals:** Updated `apps/frontend/app/components/onboarding/progress-bar.tsx` to remove percentage text and the animated progress bar.
  2. **Added mobile current-step summary:** Updated `apps/frontend/app/components/onboarding/progress-bar.tsx` to show `Step n`, `n/5`, and the current step label on small screens.
  3. **Locked the UI contract:** Added `apps/frontend/app/components/onboarding/progress-bar.test.tsx` to verify the simplified progress indicator does not render duplicate percentage/progress bar signals.
- **Outcome:** Users now see one clear progress indicator for the manual-entry form without redundant visual noise.

---
