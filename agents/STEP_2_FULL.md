# TailorCV - Step 2: First Job Customization Flow

## Complete Visual Guide with Screen Designs

**Last Updated:** December 6, 2025  
**Status:** Ready for Development

---

## Overview

This document visualizes the complete job customization journey from onboarding completion to downloading the first tailored resume. ASCII diagrams are fully rebuilt to avoid broken formatting.

**Goal:** Deliver a clear, highly visual specification file for developers and designers.

---

## STEP 2 JOURNEY MAP

```
┌───────────────┐     ┌───────────────┐     ┌────────────────┐     ┌──────────────┐     ┌───────────────┐
│ Onboarding     │ --> │  Success      │ --> │ Job Input Form │ --> │ AI Processing │ --> │ Results Screen │
│ Complete       │     │  Modal Prompt │     │                │     │ (Loading)     │     │ (Diff View)    │
└───────────────┘     └───────────────┘     └────────────────┘     └──────────────┘     └───────────────┘
                           │                                                          │
                           │                                                          │
                       [Go to Dashboard]                                         [Download]
                           │                                                          │
                           ▼                                                          ▼
                    ┌───────────────┐                                        ┌────────────────┐
                    │ Empty          │ <-- user has no data                  │ Dashboard       │
                    │ Dashboard      │                                        │ With Data      │
                    └───────────────┘                                        └────────────────┘
```

---

# SCREEN 1 — SUCCESS MODAL AFTER ONBOARDING

```
──────────────────────────────────────────────────────────────────────────────
                         🎉 YOUR BASE RESUME IS READY!
──────────────────────────────────────────────────────────────────────────────

You've successfully created your base resume.
Now let's customize it for a real job and see the magic happen!

┌──────────────────────────────────────────────────────────────────────────┐
│  DO YOU HAVE A JOB DESCRIPTION READY?                                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  ✅ YES — I HAVE A JOB DESCRIPTION                                 │  │
│  │                                                                    │  │
│  │  Paste it now and get your tailored resume in under 30 seconds!   │  │
│  │                                                                    │  │
│  │                 [ Customize Now → ]                                │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  📋 NO — I WILL BROWSE JOBS FIRST                                 │  │
│  │                                                                    │  │
│  │            [ Go to Dashboard ]                                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  💡 You have **3 free customizations**. Use one now to see AI magic.    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 2 — JOB INPUT FORM

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ✨ CUSTOMIZE RESUME FOR A JOB                         │
│                 Paste the job description and we’ll tailor it               │
│                       into the perfect version in 30 sec                    │
├──────────────────────────────────────────────────────────────────────────────┤

 STEP 1 OF 2 — ENTER JOB DETAILS

┌──────────────────────────────────────────────────────────────────────────────┐
│ JOB TITLE (Optional)                                                        │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Senior Frontend Engineer                                                 │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ 💡 Used to personalize resume header                                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ COMPANY NAME (Optional)                                                     │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Acme Corporation                                                         │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ 💡 Helps you track applications                                             │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│ JOB DESCRIPTION (Required)                                                  │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Paste the full job description here…                                    │ │
│ │ Include: requirements, responsibilities, tech stack, expectations        │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ 💡 The more detail, the better the tailoring                                │
└──────────────────────────────────────────────────────────────────────────────┘


 FREE CREDITS: 3 remain

[ Cancel ]                        [ GENERATE TAILORED RESUME → ]

└──────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 3 — AI PROCESSING (LOADING)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ✨ Tailoring Your Resume... Please wait                   │
├──────────────────────────────────────────────────────────────────────────────┤

                               ⟳ (animated spinner)

──────────────────────────── AI PROCESS STEPS ────────────────────────────────

 ✓ Analyzing job requirements…
 ✓ Extracting required skills…
 → Matching your experience to the role…                 62%
   ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░

 → Rewriting your professional summary…
 → Optimizing experience bullets…
 → Reordering skills for relevance…
 → Generating final ATS-ready resume…

───────────────────────────────────────────────────────────────────────────────
💡 TailorCV analyzes 50+ signals to tailor your resume precisely.
───────────────────────────────────────────────────────────────────────────────
```

---

# SCREEN 4 — BEFORE / AFTER COMPARISON RESULTS

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     🎉 YOUR TAILORED RESUME IS READY!                         │
│       Senior Frontend Engineer  —  Acme Corporation (Customized 2 min ago)    │
├──────────────────────────────────────────────────────────────────────────────┤


──────────────────────────── WHAT WE CHANGED ────────────────────────────────

┌───────────────────────────────┬────────────────────────────────────────────┐
│           BEFORE               │                AFTER                       │
│    (Base Resume Version)       │       (Tailored for This Job)              │
├───────────────────────────────┼────────────────────────────────────────────┤
│ PROFESSIONAL SUMMARY           │ PROFESSIONAL SUMMARY                       │
│ --------------------           │ --------------------                       │
│ Full-stack developer with      │ Senior Frontend Engineer with 3+ years     │
│ 3 years experience…            │ specializing in React + TypeScript…        │
│                               │ → Added required keywords                   │
│                               │ → Adjusted seniority match                  │
├───────────────────────────────┼────────────────────────────────────────────┤
│ SKILLS                         │ SKILLS (Reordered for ATS Relevance)       │
│ React, TS, Node, SQL...        │ React, TypeScript, Redux, Tailwind, Node…  │
│                               │ ↑ Prioritized required tech                 │
├───────────────────────────────┼────────────────────────────────────────────┤
│ EXPERIENCE (SoftSync)          │ EXPERIENCE (SoftSync)                       │
│ • Built dashboards             │ • Led React-based SaaS frontends (10k users)│
│ • Mentored juniors             │ • Mentored devs + code reviews             │
│ • Improved perf by 40%         │ • Improved performance by 40%              │
│                               │ • Collaborated with design/backend          │
└───────────────────────────────┴────────────────────────────────────────────┘

──────────────────────────── KEY IMPROVEMENTS ───────────────────────────────

 ✓ Summary rewritten for React-focused seniority
 ✓ Skills reordered to match job requirements
 ✓ Experience bullets rewritten & expanded
 ✓ Keywords “scalable,” “architecture,” “lead” inserted
 ✓ ATS optimization applied

──────────────────────────────────────────────────────────────────────────────

 MATCH SCORE: 87% (Excellent fit)

──────────────────────────────────────────────────────────────────────────────

   [ DOWNLOAD PDF ⬇ ]       [ EDIT MANUALLY ✏️ ]        [ SAVE & GO TO DASHBOARD ]

──────────────────────────────────────────────────────────────────────────────
 FREE CREDITS LEFT: 2
```

---

# SCREEN 5 — EDIT MODE (INLINE EDITING)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  ✏️ EDIT MODE                                 │
│                Make final tweaks before downloading your resume              │
├──────────────────────────────────────────────────────────────────────────────┤

───────────────────────── PROFESSIONAL SUMMARY ───────────────────────────────

[ Senior Frontend Engineer with 3+ years specializing in React... (editable) ]
                                      [ Reset AI ]

────────────────────────────── SKILLS (DRAG ORDER) ───────────────────────────

 [⋮ React]  [⋮ TypeScript]  [⋮ Redux]  [⋮ Tailwind]  [⋮ Node]  [ + Add Skill ]

───────────────────────────── EXPERIENCE SECTION ─────────────────────────────

SoftSync — Frontend Team Lead (Jan 2024 – Present)           [ Reset AI ]

 • Led frontend development for React-based SaaS…   (editable)
 • Mentored developers…                             (editable)
 • Improved performance by 40%                      (editable)
 [ + Add Bullet ]

──────────────────────────────────────────────────────────────────────────────

[ Cancel ]             [ Save Changes ]             [ Download PDF ⬇ ]
```

---

# SCREEN 6 — DASHBOARD (EMPTY STATE)

```
┌───────────────────────────── DASHBOARD ─────────────────────────────────────┐

Welcome, Murad! 👋
Your base resume is ready. Start customizing to land interviews faster.

──────────────────────────── QUICK ACTIONS ───────────────────────────────────

┌────────────────────────────────────────────────────────────────────────────┐
│ 🎯 Customize for a Job                                                    │
│ Paste a job description and we'll tailor it instantly.                    │
│ [ Start → ]                                                               │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 📥 Download Base Resume                                                   │
│ [ Download PDF ]                                                          │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ ✏️ Edit Base Resume                                                       │
│ [ Edit → ]                                                                │
└────────────────────────────────────────────────────────────────────────────┘

──────────────────────────────────────────────────────────────────────────────
 PLAN: Free — 3 Customizations Remaining
```

---

# SCREEN 7 — DASHBOARD (WITH DATA)

```
──────────────────────────── RECENT CUSTOMIZATIONS ───────────────────────────

┌────────────────────────────────────────────────────────────────────────────┐
│ Senior Frontend Engineer — Acme Corp                                      │
│ Match Score: 87%  |  Created: 2 min ago                                   │
│                                                                            │
│ [ Download PDF ]   [ View Details ]   [ Delete ]                           │
└────────────────────────────────────────────────────────────────────────────┘

[ + Customize for Another Job ]
Free credits left: 2
```

---

# END OF DOCUMENT
