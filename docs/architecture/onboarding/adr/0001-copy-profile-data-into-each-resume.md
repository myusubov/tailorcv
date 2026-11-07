# ADR 0001: Copy Profile Data Into Each Resume

- **Status:** Accepted
- **Date:** 2026-11-06
- **Domain:** docs/architecture/onboarding/
- **Related changelog entry:** [changelog.md](../changelog.md#resume-data-model-rewrite)

---

## Context

A user has one profile (contact, experiences, educations, certifications, languages) and creates many resumes from it. Each resume must be editable and tailorable without changing the profile or any other resume, and a later profile edit must not rewrite resumes that already exist. The previous model stored a resume as a single JSON column and had no profile.

## Decision

`createResume` copies the profile's rows into new rows owned by the new resume. A contact, experience, education, certification or language row belongs to exactly one owner: a profile (`profileId`) or a resume (`resumeId`). The database enforces it with a `CHECK` on `num_nonnulls("profileId", "resumeId") = 1` on those five tables, so a resume never points at a profile row.

After creation the two sets of rows are independent: editing the profile does not change existing resumes, and editing a resume does not change the profile. `position` is assigned from the copy order, not copied from the profile row.

## Considered Options

| Option | Tradeoff |
| ------ | -------- |
| Copy rows into the resume (chosen) | Resumes are independent and the database enforces ownership; data is stored once per resume. |
| Resume references the profile's rows | No duplicate data, but a profile edit changes every resume, and a resume could not hold its own wording without a copy anyway. |
| Keep a JSON snapshot column per resume | Simple to write, but sections cannot be ordered, queried or edited as rows, which the previous model already showed. |

## Consequences

- Profile edits never reach existing resumes; that is intended.
- `createResume` copies field by field, so a new profile column must be added to the copy or it is silently dropped.
- Resume rows can be deleted with the resume (`onDelete: Cascade`) without touching the profile.
- The copy and the ownership `CHECK` have no test, and the migration has not been recorded as applied or verified.

## References

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/20261104125831_resume_rewrite/migration.sql`
- `apps/backend/src/services/resume.service.ts`
