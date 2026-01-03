# User Story: Draft Resume Review & Interactive Editor

## Epic

**As a user**, I want to review and refine my AI-generated resume draft so that I can ensure accuracy and completeness before finalizing it.

---

## User Journey

### 1. Registration & Onboarding Entry

**Given** a new user visits TailorCV  
**When** they complete signup  
**Then** they are immediately redirected to the onboarding flow

### 2. Onboarding Method Selection

**Given** the user is on the onboarding page  
**When** they view the method selection screen  
**Then** they see three options:

- Manual Entry (Form-based input)
- Upload About Me (PDF/DOCX upload)
- Connect GitHub (OAuth + repo selection)

**And** all three methods are treated equally by the system

### 3. AI Generation Process

**Given** the user completes any onboarding method  
**When** the AI finishes processing the input  
**Then** a `BaseResume` record is created with `status: DRAFT`

**And** the user is redirected to `/resumes/[id]/review`

---

## The Draft Review Component

### Overview

The Draft Review is a **split-screen interactive editor** that bridges the gap between AI-generated content and user-verified accuracy.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Review Your Resume Draft"                         │
│  Progress: 65% Complete • 3 Missing Fields                  │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────┬──────────────────────────────────┐
│  LEFT PANEL              │  RIGHT PANEL                     │
│  (Editor Controls)       │  (Live Preview)                  │
│                          │                                  │
│  ┌────────────────────┐  │  ┌────────────────────────────┐ │
│  │ Data Analysis      │  │  │                            │ │
│  │                    │  │  │   [PDF/HTML Resume View]   │ │
│  │ ✅ Skills (15)     │  │  │                            │ │
│  │ ✅ Projects (3)    │  │  │   Updates in real-time     │ │
│  │ ⚠️  Experience (0) │  │  │   as user edits left panel │ │
│  │ ❌ Phone Number    │  │  │                            │ │
│  └────────────────────┘  │  └────────────────────────────┘ │
│                          │                                  │
│  ┌────────────────────┐  │                                  │
│  │ Direct Edit Fields │  │                                  │
│  │ First Name: [___]  │  │                                  │
│  │ Last Name:  [___]  │  │                                  │
│  │ Email:      [___]  │  │                                  │
│  └────────────────────┘  │                                  │
│                          │                                  │
│  ┌────────────────────┐  │                                  │
│  │ AI Assistant       │  │                                  │
│  │                    │  │                                  │
│  │ 💬 Chat with AI    │  │                                  │
│  │ "Add my role as    │  │                                  │
│  │  Senior Engineer"  │  │                                  │
│  └────────────────────┘  │                                  │
│                          │                                  │
│  [Mark as Ready] ──────► │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

---

## Feature Requirements

### FR-1: Data Completeness Analysis

**Given** a draft resume is loaded  
**When** the review page renders  
**Then** the system displays:

- ✅ **Complete**: Sections with sufficient data (e.g., "Skills: 15 found")
- ⚠️ **Incomplete**: Sections with partial data (e.g., "Experience: Projects detected but no company listed")
- ❌ **Missing**: Required fields that are empty (e.g., "Phone Number: Missing")

**Acceptance Criteria:**

- Visual indicators (checkmark, warning, error icons)
- Count of items in each section
- Suggested actions for incomplete sections

---

### FR-2: Real-Time Direct Editing

**Given** the user is on the review page  
**When** they change any field in the left panel  
**Then** the right-side preview updates **instantly** (< 200ms)

**Examples:**

- Change `firstName` → Preview header updates
- Reorder projects → Preview project section reorders
- Add a new skill → Preview skills list appends

**Technical Notes:**

- Use React state for instant local updates
- Debounce API saves (e.g., 1 second after last keystroke)
- Optimistic UI updates (don't wait for server confirmation)

---

### FR-3: AI Chat Assistant

**Given** the user wants to make bulk changes  
**When** they type a natural language request in the AI chat box  
**Then** the AI parses the request and updates the resume JSON

**Example Interactions:**

| User Input                                | AI Action                                 |
| ----------------------------------------- | ----------------------------------------- |
| "Change my title to Senior Engineer"      | Updates `professionalSummary.title` field |
| "Add Python to my skills"                 | Appends "Python" to `skills` array        |
| "Move my internship to education section" | Relocates the item + updates category     |

**Acceptance Criteria:**

- AI responses are streamed (SSE or similar)
- Preview updates as soon as AI confirms the change
- User can undo AI changes
- Clear error handling if AI misunderstands the request

---

### FR-4: Mark as Ready (Transition to COMPLETED)

**Given** the user has reviewed the draft  
**When** they click "Mark as Ready"  
**Then** the system:

1. Validates required fields (name, email, at least 1 skill)
2. If valid: Updates `status` from `DRAFT` to `COMPLETED`
3. Redirects to the main dashboard
4. Unlocks resume download/customization features

**If validation fails:**

- Show error modal with missing fields highlighted
- Prevent status transition

---

## Edge Cases & Error Handling

### EC-1: AI Generates Completely Empty Resume

**Scenario**: User uploads a corrupted PDF, AI extracts nothing  
**Expected**:

- Show "Draft Created" but with 0% completion
- Display message: "We couldn't extract much. Let's fill this in together."
- Pre-fill user's name/email from Clerk profile

### EC-2: User Refreshes Page Mid-Edit

**Scenario**: User makes changes, refreshes browser before auto-save completes  
**Expected**:

- Auto-save triggers every 1 second (debounced)
- On page load, fetch latest saved state from DB
- Show "Last saved: 3 seconds ago" indicator

### EC-3: Conflicting AI Edits

**Scenario**: User manually types "React" in skills, simultaneously asks AI to "add React"  
**Expected**:

- AI detects duplicate and responds: "React is already in your skills list"
- No duplicate entry created

### EC-4: User Tries to "Mark as Ready" with Missing Required Fields

**Scenario**: User skips phone number (optional) but also skips email (required)  
**Expected**:

- Validation error modal appears
- Highlight missing "Email" field in red
- Do not transition to `COMPLETED` status

---

## Technical Implementation Notes

### Backend Changes Required

1. **Add `status` field** to `BaseResume` (✅ Already done)
2. **Create PATCH `/api/resumes/:id`** endpoint for incremental updates
3. **Create POST `/api/resumes/:id/ai-edit`** endpoint for AI chat requests
4. **Validation logic** for required fields before `DRAFT → COMPLETED` transition

### Frontend Components

1. **`ReviewPage.tsx`**: Main container with split layout
2. **`DataAnalysisPanel.tsx`**: Shows completeness metrics
3. **`DirectEditForm.tsx`**: Editable fields with real-time sync
4. **`AIChatBox.tsx`**: Chat interface with streaming responses
5. **`LiveResumePreview.tsx`**: PDF/HTML renderer that updates on state change

### State Management

- Use **React Context** or **Zustand** to manage draft state
- Sync local state with backend via debounced PATCH requests
- Optimistic updates for perceived performance

---

## Success Metrics

- **User completes review**: % of users who transition `DRAFT → COMPLETED`
- **Time to complete**: Average time spent in review mode
- **AI chat usage**: % of users who use AI assistant vs. manual edit
- **Edit frequency**: Number of changes made before marking ready

---

## Future Enhancements (Out of Scope for V1)

- **Collaborative editing**: Share draft link with friend for feedback
- **Version history**: Undo/redo any change
- **AI suggestions**: "We noticed you have 3 years of React. Should we highlight this in your summary?"
- **Export to Google Docs**: Allow users to continue editing in Docs
