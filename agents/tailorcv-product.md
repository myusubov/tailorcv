# TailorCV - Product Requirements Document (PRD)

## Executive Summary

**Product Name:** TailorCV  
**Domain:** tailorcv.xyz  
**Tagline:** "Tailor your CV for any job in 30 seconds"  
**Category:** B2B SaaS, Developer Tools, AI-Powered Resume Builder  
**Target Launch:** 8 weeks from start  
**Business Model:** Freemium (Free tier + Pro monthly/lifetime)

---

## Problem Statement

### The Pain Point
Developers waste 15-20 minutes per job application copying their resume and job descriptions to ChatGPT, then manually reformatting the AI's output. When applying to 50-100 jobs, this wastes 12-33 hours of valuable time.

### Current "Solution" (Manual ChatGPT Workflow)
1. Open ChatGPT
2. Copy entire resume
3. Copy job description
4. Paste both into ChatGPT
5. Wait for response
6. Copy AI output
7. Manually fix formatting
8. Download/save
9. Repeat 50-100 times

**Time per application:** 15-20 minutes  
**User frustration:** High (repetitive, manual, error-prone)

---

## Solution: TailorCV

### What It Does
TailorCV stores your base resume once, then instantly customizes it for any job in 30 seconds using AI. One-click download of perfectly formatted, ATS-friendly PDFs.

### Core Value Proposition
- **Speed:** 30 seconds vs 15-20 minutes (30x faster)
- **Quality:** AI-optimized for each specific job
- **Organization:** Track which resume for which job
- **Convenience:** No copy-pasting, no manual formatting
- **ATS-Friendly:** Professional PDF output that passes applicant tracking systems

---

## Target Users

### Primary Audience
**Self-taught and junior developers actively job searching**
- Age: 18-30
- Experience: 0-5 years
- Education: Self-taught, bootcamp, or recent CS grads
- Location: Global (international remote jobs)
- Pain: Applying to 50-100+ jobs, need to customize each resume
- Willingness to pay: $10-20/month during active search

### Secondary Audience
**Mid-level developers switching jobs**
- Experience: 5-10 years
- Pain: Need to tailor resume for senior roles
- Frequency: Every 2-3 years during job search

### User Personas

**Persona 1: Murad (Primary)**
- 18 years old, self-taught developer
- 3 years experience, no CS degree
- Currently applying to 100+ international remote jobs
- Wasting 15 minutes per application
- Budget: $10-20/month acceptable during 2-3 month search
- Needs: Speed, quality customization, version tracking

**Persona 2: Sarah (Secondary)**
- 26, bootcamp grad, 2 years experience
- Switching from frontend to full-stack roles
- Applying to 30-50 jobs
- Frustrated with manual ChatGPT workflow
- Needs: Professional output, ATS optimization

---

## Core Features (MVP - Week 1-8)

### 1. Base Resume Storage
**Description:** User creates account and inputs resume once  
**Components:**
- Contact information (name, email, phone, location, LinkedIn, GitHub, portfolio)
- Professional summary (2-3 sentences)
- Work experience (company, title, dates, bullet points, tech stack)
- Projects (name, description, tech stack, links)
- Skills (categorized: languages, frameworks, tools)
- Education (degree, school, dates)

**User Flow:**
1. Sign up with email or Google OAuth
2. Complete onboarding form (step-by-step)
3. Preview base resume
4. Save to database

**Data Storage:** PostgreSQL via Prisma ORM

---

### 2. Job Description Input
**Description:** User pastes job description for customization  
**Components:**
- Text area for job description (required)
- Company name field (optional)
- Job title field (optional)

**User Flow:**
1. Click "Customize Resume"
2. Paste job description
3. Add company/title (optional)
4. Click "Generate"

**Processing:** Extract key requirements via AI

---

### 3. AI Customization Engine
**Description:** AI analyzes job requirements and rewrites resume to match  
**Technology:** Anthropic Claude API (Sonnet 4.5)

**What Gets Customized:**
- Professional summary (rewritten to match role)
- Experience bullet points (reordered and reworded)
- Projects (highlighted relevant ones)
- Skills (reordered by relevance)

**What Stays the Same:**
- Contact information
- Company names and dates (factual data)
- Core structure

**User Flow:**
1. AI processes job description + base resume
2. Shows before/after comparison
3. User can accept or reject changes
4. User can manually edit customized version
5. Save customized resume

**Processing Time:** 5-10 seconds  
**Cost per customization:** ~$0.002 (Claude API)

---

### 4. Resume Download (PDF Export)
**Description:** One-click download of customized resume as PDF  
**Technology:** @react-pdf/renderer (client-side)

**Features:**
- Clean, ATS-friendly format
- Professional template (developer-focused)
- No watermarks (even on free tier)
- File size: <500KB
- Format: Letter (8.5" x 11")

**User Flow:**
1. Click "Download PDF"
2. PDF generates in 1-2 seconds
3. Downloads to user's computer

---

### 5. Resume Version History
**Description:** Track every customized resume with metadata  
**Data Stored:**
- Customized resume data (JSON)
- Job title
- Company name
- Date applied
- Original job description
- Match score (future feature)

**User Flow:**
1. View all past customized resumes
2. Click to view details
3. Download old version
4. Track application history

**UI:** Table/card view with filters and search

---

### 6. Usage Limits & Payment
**Description:** Freemium model with Stripe integration

**Free Tier:**
- 3 customized resumes per month
- 1 base resume storage
- Basic PDF template
- Email support

**Pro Monthly ($12/month):**
- Unlimited customized resumes
- Multiple base resumes (3)
- Premium PDF templates (3 designs)
- Cover letter generation (Week 5+)
- Priority support

**Pro Lifetime ($39 one-time):**
- Everything in Pro Monthly
- Pay once, use forever
- Future feature updates included

**Payment Integration:** Stripe  
**Enforcement:** Track usage in database, block after limit

---

## Post-MVP Features (Week 9-12)

### Phase 2 Features
- Multiple PDF templates (3 professional designs)
- Cover letter generation (AI-powered)
- Match score (85% fit indicator)
- Skills highlighting (visual emphasis on matching skills)

### Phase 3 Features
- GitHub profile import (auto-populate projects)
- LinkedIn import (auto-populate experience)
- Chrome extension (apply directly from job boards)
- Job application tracker (integrated CRM)
- Interview prep (AI-generated questions)

---

## Technical Architecture

### Tech Stack

**Frontend (apps/frontend):**
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI Library: Hero UI v3
- Auth: Clerk (email + Google OAuth)
- Forms: React Hook Form + Zod validation
- PDF: @react-pdf/renderer
- Icons: Lucide React
- Notifications: react-hot-toast

**Backend (apps/backend):**
- Runtime: Node.js
- Framework: Express + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: Clerk (server-side)
- AI: Anthropic Claude API
- Payment: Stripe
- Email: Resend (Week 6)

**Shared (packages/shared):**
- TypeScript types/interfaces
- Zod schemas
- Utility functions

**Monorepo:** npm workspaces  
**Deployment:** Vercel (frontend) + Railway (backend)

---

### Database Schema

**User Table:**
- id (primary key)
- clerkUserId (unique)
- email (unique)
- name
- plan (FREE | PRO_MONTHLY | PRO_LIFETIME)
- creditsUsed (monthly count)
- creditsLimit (3 for free, unlimited for pro)
- createdAt
- updatedAt

**BaseResume Table:**
- id (primary key)
- userId (foreign key)
- name (e.g., "Software Engineer Resume")
- data (JSON - entire resume structure)
- createdAt
- updatedAt

**CustomizedResume Table:**
- id (primary key)
- userId (foreign key)
- baseResumeId (foreign key)
- jobTitle
- companyName
- jobDescription (text)
- customizedData (JSON)
- matchScore (integer, 0-100)
- createdAt

---

### API Endpoints

**Authentication:**
- POST /api/auth/register - Create account
- POST /api/auth/login - Login
- GET /api/user/me - Get user info

**Resume Management:**
- GET /api/resume - Get all base resumes
- POST /api/resume - Create base resume
- GET /api/resume/:id - Get single resume
- PATCH /api/resume/:id - Update resume
- DELETE /api/resume/:id - Delete resume

**AI Customization:**
- POST /api/customize - Main AI customization endpoint
- GET /api/customize/:id - Get customized resume
- GET /api/customize - Get all customized resumes

**PDF & Payments:**
- POST /api/pdf - Generate PDF
- POST /api/webhooks/stripe - Stripe webhook
- PATCH /api/user/settings - Update user settings

---

## User Flows

### Flow 1: First-Time User Onboarding
1. Land on homepage (tailorcv.xyz)
2. Click "Get Started"
3. Sign up (email or Google)
4. Complete onboarding wizard:
   - Step 1: Contact info
   - Step 2: Experience (1-3 jobs)
   - Step 3: Projects (1-3)
   - Step 4: Skills
   - Step 5: Education
5. Preview base resume
6. Save and go to dashboard

**Time:** 10-15 minutes (one-time setup)

---

### Flow 2: Customizing Resume for Job
1. Dashboard: Click "Customize Resume"
2. Paste job description
3. Add company name (optional)
4. Click "Generate"
5. Wait 5-10 seconds (loading state)
6. View before/after comparison
7. Make manual edits (if needed)
8. Click "Download PDF"
9. PDF downloads instantly

**Time:** 30 seconds (core value prop)

---

### Flow 3: Viewing Application History
1. Dashboard: Navigate to "My Applications"
2. See table of all customized resumes
3. Columns: Job Title, Company, Date, Actions
4. Click row to view details
5. Download old PDF
6. Track which jobs applied to

---

### Flow 4: Upgrading to Pro
1. Hit free tier limit (3 resumes)
2. See "Upgrade to Pro" banner
3. Click upgrade
4. Choose plan (monthly or lifetime)
5. Stripe checkout
6. Payment success
7. Credits reset to unlimited
8. Continue using app

---

## Success Metrics

### Week 2 Goals (Internal MVP)
- âœ… Used tool for 5 real job applications
- âœ… Saves 10+ minutes per application
- âœ… Quality matches manual ChatGPT output

### Week 4 Goals (Friends Beta)
- âœ… 3-5 developer friends tested
- âœ… 20+ customized resumes generated
- âœ… No major bugs
- âœ… Positive feedback on UX

### Week 8 Goals (Public Launch)
- ðŸŽ¯ 50-100 signups
- ðŸŽ¯ 3-5 paying customers
- ðŸŽ¯ $50-150 revenue
- ðŸŽ¯ Product Hunt launch (#1-3 Product of the Day)
- ðŸŽ¯ Reddit posts (r/cscareerquestions, r/webdev)

### Month 3 Goals
- ðŸŽ¯ 500+ signups
- ðŸŽ¯ 25-50 paying customers
- ðŸŽ¯ $300-600 MRR
- ðŸŽ¯ 10%+ free-to-paid conversion

### Month 6 Goals
- ðŸŽ¯ 1,000+ signups
- ðŸŽ¯ 50-100 paying customers
- ðŸŽ¯ $500-1,000 MRR (initial target achieved)
- ðŸŽ¯ Positive word-of-mouth growth

---

## 8-Week Development Timeline

### Week 1-2: Foundation & Core Features
**Goals:** Monorepo setup, auth, base resume input, AI customization

**Tasks:**
- âœ… Monorepo structure (npm workspaces)
- âœ… Frontend scaffolding (Next.js + Hero UI)
- âœ… Backend setup (Express + Prisma)
- âœ… Clerk authentication integration
- âœ… Database schema design
- âœ… Base resume input form
- âœ… Job description input form
- âœ… Anthropic Claude API integration
- âœ… Prompt engineering for customization
- âœ… Before/after comparison UI

**Deliverable:** Can input resume, paste job, get AI-customized version

---

### Week 3-4: Polish & User Experience
**Goals:** PDF export, versioning, UI improvements

**Tasks:**
- PDF generation (@react-pdf/renderer)
- Resume version history (database + UI)
- Application tracker (list view)
- Section-by-section editing
- Mobile responsive design
- Loading states and animations
- Error handling
- Empty states

**Deliverable:** Fully functional MVP with professional UX

---

### Week 5-6: Monetization & Premium Features
**Goals:** Stripe integration, usage limits, premium templates

**Tasks:**
- Stripe integration (monthly + lifetime plans)
- Free tier enforcement (3/month limit)
- Usage tracking in database
- Account settings page
- Email notifications (Resend)
- Premium PDF templates (3 designs)
- Cover letter generation (stretch goal)
- Landing page optimization

**Deliverable:** Revenue-generating product

---

### Week 7: Testing & Bug Fixes
**Goals:** Beta testing, polish, performance

**Tasks:**
- Beta testing with 5-10 developer friends
- Bug fixes based on feedback
- Performance optimization (Lighthouse 95+)
- SEO optimization
- Analytics integration (PostHog/Plausible)
- Demo video (2-minute Loom)
- Documentation

**Deliverable:** Polished, launch-ready product

---

### Week 8: Launch Week
**Goals:** Public launch, get first users and customers

**Tasks:**
- Product Hunt launch (prepare assets, schedule)
- Reddit launch posts:
  - r/cscareerquestions
  - r/webdev
  - r/learnprogramming
  - r/selfhosted
- Twitter/X announcement thread
- Dev.to blog post ("How I built TailorCV in 8 weeks")
- LinkedIn post
- Outreach to tech influencers
- Monitor feedback and iterate

**Deliverable:** Live product with 50-100 users

---

## Marketing & Growth Strategy

### Launch Channels (Week 8)
1. **Product Hunt** - Target #1-3 Product of the Day
2. **Reddit** - Developer communities (8M+ members)
3. **Twitter/X** - #BuildInPublic, #IndieDev, #DevTools
4. **Dev.to** - Blog post with technical details
5. **LinkedIn** - Professional network
6. **Hacker News** - "Show HN" post

### Content Marketing (Post-Launch)
- Weekly blog posts (resume tips, job search advice)
- YouTube videos (demo, tutorials)
- Twitter threads (job search lessons)
- Email newsletter (weekly tips)

### SEO Keywords
- "customize resume for job"
- "AI resume builder for developers"
- "tailor cv for job application"
- "resume customization tool"
- "developer resume generator"

---

## Competitive Analysis

### Direct Competitors
**Rezi.ai** - $29/month, ATS scoring  
**Resume Worded** - $49/month, detailed feedback  
**Teal HQ** - $29/month, full job search suite  

**TailorCV Advantages:**
- âœ… Cheaper ($12/month vs $29-49/month)
- âœ… Faster (30 seconds vs 5+ minutes)
- âœ… Developer-focused (not generic)
- âœ… Honest pricing (no bait-and-switch)
- âœ… Lifetime option ($39)

### Indirect Competitors
**ChatGPT** - Free, but manual and slow  
**Canva Resume Builder** - Visual, not AI-powered  
**Indeed Resume** - Free, basic, no customization

---

## Risks & Mitigation

### Risk 1: Low Conversion (Free â†’ Paid)
**Mitigation:**
- 3 free resumes = enough to test, not enough for full search
- Clear upgrade prompts at limit
- Show time saved and value provided
- Offer lifetime deal ($39 = impulse buy)

### Risk 2: AI Quality Issues
**Mitigation:**
- Extensive prompt engineering
- Manual editing allowed
- Before/after comparison
- User feedback loop

### Risk 3: Competition from Free Tools
**Mitigation:**
- Emphasize speed (30 seconds)
- Version tracking (ChatGPT doesn't have)
- Professional output (better than manual)
- Developer-specific features

### Risk 4: Low Organic Traffic
**Mitigation:**
- Product Hunt launch for initial boost
- Reddit posts for developer audience
- SEO optimization for long-term growth
- Word-of-mouth from satisfied users

---

## Financial Projections

### Costs
**Monthly Fixed Costs:**
- Domain: $1/month (tailorcv.xyz)
- Vercel: $0 (free tier, then $20/month at scale)
- Railway: $5/month (backend hosting)
- Total: ~$6-26/month

**Variable Costs:**
- Anthropic API: $0.002 per customization
- At 1,000 customizations/month: $2
- At 10,000 customizations/month: $20

**Total Monthly Costs:** $10-50/month at 1,000 users

---

### Revenue Projections

**Month 1 (Launch):**
- 100 signups
- 5 paid ($12/month) = $60 MRR
- 0 lifetime = $0
- **Total: $60 MRR**

**Month 3:**
- 500 signups
- 25 monthly ($12) = $300 MRR
- 10 lifetime ($39) = $390 one-time
- **Total: $300 MRR + $390 one-time**

**Month 6:**
- 1,000 signups
- 50 monthly ($12) = $600 MRR
- 20 lifetime ($39) = $780 one-time
- **Total: $600 MRR + $780 one-time**

**Break-even:** ~5 paying customers (covers costs)  
**Target achieved:** Month 6 ($500-1,000 MRR)

---

## Design Principles

### Visual Identity
**Colors:**
- Primary: Blue (#3B82F6) - Trust, professionalism
- Secondary: Indigo (#6366F1) - Tech-forward
- Accent: Green (#10B981) - Success, action
- Neutral: Gray (#6B7280) - Text, backgrounds

**Typography:**
- Headings: Inter (bold, modern)
- Body: Inter (regular, readable)
- Code: JetBrains Mono (developer aesthetic)

**Style:**
- Clean, minimal, professional
- Generous whitespace
- Clear hierarchy
- Subtle animations
- Developer-friendly (not overly corporate)

---

### UI/UX Principles
1. **Speed First** - Every action should feel instant
2. **Zero Learning Curve** - Obvious what to do next
3. **Progressive Disclosure** - Show advanced features after basics
4. **Helpful Defaults** - Works well without configuration
5. **Visual Feedback** - Loading states, success messages, errors
6. **Mobile-First** - Works on phone (many users browse jobs on mobile)

---

## Technical Constraints

### Performance Targets
- Lighthouse Performance: 95+
- Time to First Byte: <200ms
- First Contentful Paint: <1.0s
- AI customization: <10s
- PDF generation: <2s

### Browser Support
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari (iOS 15+)
- Chrome Mobile (latest)

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Alt text for images

---

## Legal & Compliance

### Privacy
- GDPR compliant (EU users)
- CCPA compliant (California users)
- Data encryption at rest and in transit
- User can delete all data
- No selling user data
- Clear privacy policy

### Terms of Service
- User owns their resume data
- We provide AI assistance, not legal advice
- No guarantee of job placement
- Can terminate accounts for abuse
- Refund policy (14 days for monthly, 30 days for lifetime)

### AI Usage
- Transparent about AI usage
- Users can edit AI output
- Not responsible for AI errors
- Users verify final resume

---

## Support & Documentation

### Help Resources
- FAQ page (common questions)
- Video tutorials (YouTube)
- Blog posts (tips and guides)
- Email support (help@tailorcv.xyz)
- In-app tooltips

### Support Channels
**Free Tier:**
- Email support (48-hour response)
- FAQ and docs

**Pro Tier:**
- Priority email (24-hour response)
- Live chat (future)

---

## Founder Context

**Builder:** Murad Yusubov  
**Age:** 18  
**Location:** Giresun, Turkey (originally from Baku, Azerbaijan)  
**Experience:** 3 years self-taught full-stack development  
**Current Role:** Frontend Team Lead at SoftSync  

**Motivation:**
Building TailorCV to:
1. Solve personal job search pain (applying to 100+ jobs)
2. Create portfolio piece for job applications
3. Generate $500-1,000/month passive income
4. Demonstrate shipping ability to employers

**Timeline:** Must ship in 8 weeks due to:
- Current job has payment reliability issues
- Active job searching (1-2 hours/day for applications)
- Limited financial runway
- Need to prove execution speed

---

## Appendix: Key Decisions Log

### Decision 1: Tech Stack
**Decision:** Express + REST (not NestJS + GraphQL)  
**Reasoning:** Faster to build, simpler architecture, sufficient for 13 API endpoints  
**Made:** Week 0 (planning)

### Decision 2: Monorepo Structure
**Decision:** npm workspaces (not pnpm, not Turborepo)  
**Reasoning:** Already using npm, simpler for solo developer  
**Made:** Week 1

### Decision 3: PDF Generation
**Decision:** @react-pdf/renderer (client-side)  
**Reasoning:** Faster, cheaper, lower server costs. Can upgrade to Puppeteer later if quality issues  
**Made:** Week 1

### Decision 4: Pricing Model
**Decision:** Freemium with lifetime option ($12/month or $39 lifetime)  
**Reasoning:** Reduces churn, developers prefer one-time payments, competitive vs market ($29-49/month)  
**Made:** Week 0 (planning)

### Decision 5: AI Provider
**Decision:** Anthropic Claude (not OpenAI)  
**Reasoning:** Better instruction following, lower cost, faster processing  
**Made:** Week 0 (planning)

---

## Version History

**v1.0** - Initial PRD (Week 0)  
**Last Updated:** December 4, 2025

---

**END OF DOCUMENT**