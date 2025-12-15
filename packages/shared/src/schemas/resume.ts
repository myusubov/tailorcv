import { z } from 'zod';

const idSchema = z.string().trim().min(1);
const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM');

export const baseResumeDataSchema = z
  .object({
    version: z.literal(1).optional().default(1),
    contact: z
      .object({
        firstName: z.string().trim().min(1),
        lastName: z.string().trim().min(1),
        headline: z.string().trim().min(1).optional(),
        email: z.email(),
        phone: z.string().trim().min(1).optional(),
        location: z.string().trim().min(1).optional(),
        websiteUrl: z.url().optional(),
        linkedinUrl: z.url().optional(),
        githubUrl: z.url().optional(),
      })
      .strict(),
    summary: z.string().trim().min(1).optional(),
    skills: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string().trim().min(1),
            category: z.string().trim().min(1).optional(),
            level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
          })
          .strict(),
      )
      .default([]),
    experience: z
      .array(
        z
          .object({
            id: idSchema,
            company: z.string().trim().min(1),
            title: z.string().trim().min(1),
            location: z.string().trim().min(1).optional(),
            startDate: yearMonthSchema,
            endDate: yearMonthSchema.optional(),
            isCurrent: z.boolean().optional(),
            tech: z.array(z.string().trim().min(1)).optional(),
            bullets: z.array(
              z
                .object({ id: idSchema, text: z.string().trim().min(1) })
                .strict(),
            ),
          })
          .strict(),
      )
      .default([]),
    projects: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string().trim().min(1),
            role: z.string().trim().min(1).optional(),
            startDate: yearMonthSchema.optional(),
            endDate: yearMonthSchema.optional(),
            url: z.url().optional(),
            repoUrl: z.url().optional(),
            tech: z.array(z.string().trim().min(1)).optional(),
            bullets: z.array(
              z
                .object({ id: idSchema, text: z.string().trim().min(1) })
                .strict(),
            ),
          })
          .strict(),
      )
      .default([]),
    education: z
      .array(
        z
          .object({
            id: idSchema,
            school: z.string().trim().min(1),
            degree: z.string().trim().min(1).optional(),
            field: z.string().trim().min(1).optional(),
            location: z.string().trim().min(1).optional(),
            startDate: yearMonthSchema.optional(),
            endDate: yearMonthSchema.optional(),
            grade: z.string().trim().min(1).optional(),
            notes: z.string().trim().min(1).optional(),
          })
          .strict(),
      )
      .optional(),
    certifications: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string().trim().min(1),
            issuer: z.string().trim().min(1).optional(),
            date: yearMonthSchema.optional(),
            url: z.url().optional(),
          })
          .strict(),
      )
      .optional(),
    languages: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string().trim().min(1),
            level: z.string().trim().min(1).optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export type BaseResumeData = z.infer<typeof baseResumeDataSchema>;
