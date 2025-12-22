import { z } from 'zod';

const LIMITS = {
  summaryMaxChars: 600,
  skillsMaxCount: 50,
  skillMaxChars: 40,
  experiencesMaxCount: 10,
  experienceJobTitleMaxChars: 80,
  experienceCompanyMaxChars: 80,
  experienceDescriptionMaxChars: 900,
  projectsMaxCount: 6,
  projectNameMaxChars: 80,
  projectDescriptionMaxChars: 600,
  projectTechStackMaxChars: 200,
  contactNameMaxChars: 80,
  contactEmailMaxChars: 120,
  contactPhoneMaxChars: 40,
  contactLocationMaxChars: 80,
  contactUrlMaxChars: 200,
  educationDegreeMaxChars: 100,
  educationSchoolMaxChars: 120,
  educationGraduationYearMaxChars: 4,
} as const;

const monthSchema = z
  .string()
  .trim()
  .regex(/^(0[1-9]|1[0-2])$/, 'Month must be 01-12');

const yearSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, 'Year must be 4 digits')
  .refine((v) => {
    const year = Number(v);
    const current = new Date().getFullYear();
    return year >= 1950 && year <= current + 1;
  }, 'Year is out of range');

function toYearMonth(month: string, year: string) {
  if (!month || !year) return null;
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  return y * 100 + m; // YYYYMM comparable integer
}

function maxChars(label: string, limit: number) {
  return z.string().superRefine((val, ctx) => {
    if (val.length <= limit) return;
    ctx.addIssue({
      code: 'custom',
      message: `${label} is too long (${val.length}/${limit})`,
    });
  });
}

function maxItems(label: string, limit: number) {
  return z.array(z.any()).superRefine((val, ctx) => {
    if (val.length <= limit) return;
    ctx.addIssue({
      code: 'custom',
      message: `${label}: too many items (${val.length}/${limit})`,
    });
  });
}

const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .pipe(maxChars('Full name', LIMITS.contactNameMaxChars)),
  email: z
    .email('Invalid email address')
    .pipe(maxChars('Email', LIMITS.contactEmailMaxChars)),
  phone: z
    .string()
    .trim()
    .pipe(maxChars('Phone number', LIMITS.contactPhoneMaxChars))
    .optional()
    .default(''),
  location: z
    .string()
    .trim()
    .min(1, 'Location is required')
    .pipe(maxChars('Location', LIMITS.contactLocationMaxChars)),
  github: z
    .string()
    .trim()
    .pipe(maxChars('URL', LIMITS.contactUrlMaxChars))
    .optional()
    .default(''),
  linkedin: z
    .string()
    .trim()
    .pipe(maxChars('URL', LIMITS.contactUrlMaxChars))
    .optional()
    .default(''),
  portfolio: z
    .string()
    .trim()
    .pipe(maxChars('URL', LIMITS.contactUrlMaxChars))
    .optional()
    .default(''),
});

const experienceSchema = z
  .object({
    id: z.string().min(1),
    jobTitle: z
      .string()
      .trim()
      .min(1, 'Job title is required')
      .pipe(maxChars('Job title', LIMITS.experienceJobTitleMaxChars)),
    company: z
      .string()
      .trim()
      .min(1, 'Company is required')
      .pipe(maxChars('Company name', LIMITS.experienceCompanyMaxChars)),
    startMonth: monthSchema,
    startYear: yearSchema,
    endMonth: z.string().trim().optional().default(''),
    endYear: z.string().trim().optional().default(''),
    isCurrent: z.boolean().default(false),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .pipe(
        maxChars('Description', LIMITS.experienceDescriptionMaxChars),
      ),
  })
  .superRefine((v, ctx) => {
    if (v.isCurrent) return;
    if (!v.endMonth) {
      ctx.addIssue({
        code: 'custom',
        message: 'End month is required unless current',
        path: ['endMonth'],
      });
    }
    if (!v.endYear) {
      ctx.addIssue({
        code: 'custom',
        message: 'End year is required unless current',
        path: ['endYear'],
      });
    }

    if (!v.endMonth || !v.endYear) return;
    const start = toYearMonth(v.startMonth, v.startYear);
    const end = toYearMonth(v.endMonth, v.endYear);
    if (start === null || end === null) return;
    if (end < start) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date must be after start date',
        path: ['endYear'],
      });
    }
  });

const projectSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .pipe(maxChars('Project name', LIMITS.projectNameMaxChars)),
  description: z
    .string()
    .trim()
    .min(20, 'Project description must be at least 20 characters')
    .pipe(
      maxChars('Project description', LIMITS.projectDescriptionMaxChars),
    ),
  techStack: z
    .string()
    .trim()
    .min(10, 'Tech stack must be at least 10 characters')
    .pipe(maxChars('Tech stack', LIMITS.projectTechStackMaxChars)),
  link: z
    .string()
    .trim()
    .pipe(maxChars('URL', LIMITS.contactUrlMaxChars))
    .optional()
    .default(''),
  repoUrl: z
    .string()
    .trim()
    .pipe(maxChars('URL', LIMITS.contactUrlMaxChars))
    .optional()
    .default(''),
});

const educationSchema = z
  .object({
    degree: z
      .string()
      .trim()
      .pipe(maxChars('Degree', LIMITS.educationDegreeMaxChars))
      .optional()
      .default(''),
    school: z
      .string()
      .trim()
      .pipe(maxChars('School', LIMITS.educationSchoolMaxChars))
      .optional()
      .default(''),
    graduationYear: z
      .string()
      .trim()
      .pipe(
        maxChars('Graduation year', LIMITS.educationGraduationYearMaxChars),
      )
      .optional()
      .default(''),
    isSelfTaught: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.isSelfTaught) {
      if (!data.degree) {
        ctx.addIssue({
          code: 'custom',
          message: 'Degree is required unless you select Self-Taught',
          path: ['degree'],
        });
      }
      if (!data.school) {
        ctx.addIssue({
          code: 'custom',
          message: 'School is required unless you select Self-Taught',
          path: ['school'],
        });
      }
    }
  });

export const onboardingSchema = z.object({
  contact: contactSchema,
  summary: z
    .string()
    .trim()
    .pipe(maxChars('Summary', LIMITS.summaryMaxChars))
    .optional()
    .default(''),
  experiences: z
    .array(experienceSchema)
    .pipe(maxItems('Experiences', LIMITS.experiencesMaxCount))
    .default([]),
  projects: z
    .array(projectSchema)
    .min(1, { error: 'Add at least 1 project' })
    .pipe(maxItems('Projects', LIMITS.projectsMaxCount))
    .default([]),
  skills: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .pipe(maxChars('Skill', LIMITS.skillMaxChars)),
    )
    .min(3, { error: 'Add at least 3 skills' })
    .pipe(maxItems('Skills', LIMITS.skillsMaxCount))
    .default([]),
  education: educationSchema,
});

export type OnboardingFormInput = z.input<typeof onboardingSchema>;
export type OnboardingFormValues = z.output<typeof onboardingSchema>;
