import { z } from 'zod';

const contactSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.email('Invalid email address'),
  phone: z.string().trim().optional().default(''),
  location: z.string().trim().min(1, 'Location is required'),
  github: z.string().trim().optional().default(''),
  linkedin: z.string().trim().optional().default(''),
  portfolio: z.string().trim().optional().default(''),
});

const experienceSchema = z
  .object({
    id: z.string().min(1),
    jobTitle: z.string().trim().min(1, 'Job title is required'),
    company: z.string().trim().min(1, 'Company is required'),
    startMonth: z.string().trim().min(1, 'Start month is required'),
    startYear: z.string().trim().min(1, 'Start year is required'),
    endMonth: z.string().trim().optional().default(''),
    endYear: z.string().trim().optional().default(''),
    isCurrent: z.boolean().default(false),
    description: z.string().trim().min(1, 'Description is required'),
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
  });

const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Project name is required'),
  description: z
    .string()
    .trim()
    .min(20, 'Project description must be at least 20 characters'),
  techStack: z
    .string()
    .trim()
    .min(10, 'Tech stack must be at least 10 characters'),
  link: z.string().trim().optional().default(''),
  repoUrl: z.string().trim().optional().default(''),
});

const educationSchema = z
  .object({
    degree: z.string().trim().optional().default(''),
    school: z.string().trim().optional().default(''),
    graduationYear: z.string().trim().optional().default(''),
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
  summary: z.string().trim().optional().default(''),
  experiences: z.array(experienceSchema).default([]),
  projects: z
    .array(projectSchema)
    .min(1, { error: 'Add at least 1 project' })
    .default([]),
  skills: z
    .array(z.string().trim().min(1))
    .min(3, { error: 'Add at least 3 skills' })
    .default([]),
  education: educationSchema,
});

export type OnboardingFormInput = z.input<typeof onboardingSchema>;
export type OnboardingFormValues = z.output<typeof onboardingSchema>;
