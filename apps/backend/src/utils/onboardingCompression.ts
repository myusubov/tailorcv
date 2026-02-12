import type { BaseResumeData } from 'shared';

type Primitive = string | number | boolean | null | undefined;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function clampString(value: Primitive, maxChars: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

/**
 * Parse YYYY-MM date string to comparable number for sorting
 */
function parseDateToNumber(date: string | null | undefined): number {
  if (!date) return -1;
  const parts = date.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1] || '01', 10);
  if (!Number.isFinite(year)) return -1;
  return year * 100 + month;
}

function uniqStable(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of values) {
    if (seen.has(v)) continue;
    seen.add(v);
    result.push(v);
  }
  return result;
}

/**
 * Compress onboarding body data for AI processing.
 * Adjusts limits based on level (0=least, 2=most compression).
 */
export function compressOnboardingBody(
  body: BaseResumeData,
  level: 0 | 1 | 2,
): BaseResumeData {
  const limitsByLevel = [
    { experiences: 8, projects: 6, skills: 40, bulletChars: 700 },
    { experiences: 6, projects: 4, skills: 30, bulletChars: 500 },
    { experiences: 4, projects: 3, skills: 24, bulletChars: 360 },
  ] as const;

  const limits = limitsByLevel[level];
  const safe = (v: Primitive, max: number) => clampString(v, max);

  const next: BaseResumeData = { ...body };

  // Compress summary
  if (next.summary != null) {
    next.summary = safe(next.summary, 500);
  }

  // Compress contact
  if (next.contact) {
    next.contact = {
      ...next.contact,
      firstName: safe(next.contact.firstName, 40) || '',
      lastName: safe(next.contact.lastName, 40) || '',
      headline: safe(next.contact.headline, 100),
      email: safe(next.contact.email, 120) || '',
      phone: safe(next.contact.phone, 40),
      location: safe(next.contact.location, 80),
      githubUrl: safe(next.contact.githubUrl, 200),
      linkedinUrl: safe(next.contact.linkedinUrl, 200),
      websiteUrl: safe(next.contact.websiteUrl, 200),
    };
  }

  // Compress skills
  if (Array.isArray(next.skills)) {
    const normalized = uniqStable(
      next.skills.map((s) => normalizeWhitespace(s.name)).filter(Boolean),
    );
    next.skills = normalized.slice(0, limits.skills).map((name, i) => ({
      id: next.skills[i]?.id || `skill-${i}`,
      name,
      category: next.skills[i]?.category || null,
      level: next.skills[i]?.level || null,
    }));
  }

  // Compress experiences - sort by most recent first
  if (Array.isArray(next.experiences)) {
    const experiences = next.experiences
      .map((e) => ({
        ...e,
        title: safe(e.title, 80) || '',
        company: safe(e.company, 80) || '',
        location: safe(e.location, 80),
        bullets: e.bullets.map((b) => ({
          id: b.id,
          text: safe(b.text, limits.bulletChars) || '',
        })),
      }))
      .sort((a, b) => {
        const aEnd = a.isCurrent
          ? Number.POSITIVE_INFINITY
          : parseDateToNumber(a.endDate);
        const bEnd = b.isCurrent
          ? Number.POSITIVE_INFINITY
          : parseDateToNumber(b.endDate);
        if (bEnd !== aEnd) return bEnd - aEnd;
        const aStart = parseDateToNumber(a.startDate);
        const bStart = parseDateToNumber(b.startDate);
        return bStart - aStart;
      })
      .slice(0, limits.experiences);

    next.experiences = experiences;
  }

  // Compress projects - sort by most recent first
  if (Array.isArray(next.projects)) {
    const projects = next.projects
      .map((p) => ({
        ...p,
        name: safe(p.name, 80) || '',
        role: safe(p.role, 80),
        url: safe(p.url, 200),
        repoUrl: safe(p.repoUrl, 200),
        bullets: p.bullets.map((b) => ({
          id: b.id,
          text: safe(b.text, limits.bulletChars) || '',
        })),
      }))
      .sort((a, b) => {
        const aEnd = a.isCurrent
          ? Number.POSITIVE_INFINITY
          : parseDateToNumber(a.endDate);
        const bEnd = b.isCurrent
          ? Number.POSITIVE_INFINITY
          : parseDateToNumber(b.endDate);
        if (bEnd !== aEnd) return bEnd - aEnd;
        const aStart = parseDateToNumber(a.startDate);
        const bStart = parseDateToNumber(b.startDate);
        return bStart - aStart;
      })
      .slice(0, limits.projects);

    next.projects = projects;
  }

  // Compress education
  if (Array.isArray(next.education)) {
    next.education = next.education.map((edu) => ({
      ...edu,
      school: safe(edu.school, 120) || '',
      degree: safe(edu.degree, 100),
      field: safe(edu.field, 100),
      location: safe(edu.location, 80),
      grade: safe(edu.grade, 20),
      notes: safe(edu.notes, 200),
    }));
  }

  return next;
}
