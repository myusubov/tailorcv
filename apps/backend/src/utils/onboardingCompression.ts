type Primitive = string | number | boolean | null | undefined;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function clampString(value: Primitive, maxChars: number) {
  if (typeof value !== 'string') return value;
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

function toYearMonth(year: Primitive, month: Primitive) {
  if (typeof year !== 'string' || typeof month !== 'string' || !year || !month)
    return null;
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  return y * 100 + m;
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

export function compressOnboardingBody<T extends Record<string, any>>(
  body: T,
  level: 0 | 1 | 2,
): T {
  const limitsByLevel = [
    { experiences: 8, projects: 6, skills: 40, expDesc: 700, projDesc: 450 },
    { experiences: 6, projects: 4, skills: 30, expDesc: 500, projDesc: 320 },
    { experiences: 4, projects: 3, skills: 24, expDesc: 360, projDesc: 240 },
  ] as const;

  const limits = limitsByLevel[level];

  const safe = (v: Primitive, max: number) => clampString(v, max);

  const next: any = { ...body };

  if (next.summary != null) next.summary = safe(next.summary, 500);

  if (next.contact && typeof next.contact === 'object') {
    next.contact = { ...next.contact };
    next.contact.fullName = safe(next.contact.fullName, 80);
    next.contact.email = safe(next.contact.email, 120);
    next.contact.phone = safe(next.contact.phone, 40);
    next.contact.location = safe(next.contact.location, 80);
    next.contact.github = safe(next.contact.github, 200);
    next.contact.linkedin = safe(next.contact.linkedin, 200);
    next.contact.portfolio = safe(next.contact.portfolio, 200);
  }

  if (Array.isArray(next.skills)) {
    const normalized = uniqStable(
      next.skills
        .filter((s: unknown): s is string => typeof s === 'string')
        .map((s: string) => normalizeWhitespace(s))
        .filter(Boolean),
    );
    next.skills = normalized.slice(0, limits.skills);
  }

  if (Array.isArray(next.experiences)) {
    const experiences = next.experiences
      .filter((e: any) => e && typeof e === 'object')
      .map((e: any) => ({
        ...e,
        jobTitle: safe(e.jobTitle, 80),
        company: safe(e.company, 80),
        description: safe(e.description, limits.expDesc),
      }))
      .sort((a: any, b: any) => {
        const aEnd = a.isCurrent
          ? Number.POSITIVE_INFINITY
          : (toYearMonth(a.endYear, a.endMonth) ?? -1);
        const bEnd = b.isCurrent
          ? Number.POSITIVE_INFINITY
          : (toYearMonth(b.endYear, b.endMonth) ?? -1);
        if (bEnd !== aEnd) return bEnd - aEnd;
        const aStart = toYearMonth(a.startYear, a.startMonth) ?? -1;
        const bStart = toYearMonth(b.startYear, b.startMonth) ?? -1;
        return bStart - aStart;
      })
      .slice(0, limits.experiences);

    next.experiences = experiences;
  }

  if (Array.isArray(next.projects)) {
    const projects = next.projects
      .filter((p: any) => p && typeof p === 'object')
      .map((p: any) => ({
        ...p,
        name: safe(p.name, 80),
        techStack: safe(p.techStack, 200),
        description: safe(p.description, limits.projDesc),
        link: safe(p.link, 200),
        repoUrl: safe(p.repoUrl, 200),
      }))
      .sort((a: any, b: any) => {
        // Sort projects by recency (end date, then start date)
        const aEnd = a.isCurrent
          ? Number.POSITIVE_INFINITY
          : (toYearMonth(a.endYear, a.endMonth) ?? -1);
        const bEnd = b.isCurrent
          ? Number.POSITIVE_INFINITY
          : (toYearMonth(b.endYear, b.endMonth) ?? -1);

        if (bEnd !== aEnd) return bEnd - aEnd;

        const aStart = toYearMonth(a.startYear, a.startMonth) ?? -1;
        const bStart = toYearMonth(b.startYear, b.startMonth) ?? -1;

        if (bStart !== aStart) return bStart - aStart;

        // Fallback to score (detail level) if dates are identical/missing
        const getScore = (p: any) =>
          (typeof p.description === 'string' ? p.description.length : 0) +
          (typeof p.techStack === 'string' ? p.techStack.length : 0) +
          (p.link ? 50 : 0) +
          (p.repoUrl ? 50 : 0);

        return getScore(b) - getScore(a);
      })
      .slice(0, limits.projects);

    next.projects = projects;
  }

  if (next.education && typeof next.education === 'object') {
    next.education = { ...next.education };
    next.education.degree = safe(next.education.degree, 100);
    next.education.school = safe(next.education.school, 120);
    next.education.graduationYear = safe(next.education.graduationYear, 4);
  }

  return next;
}
