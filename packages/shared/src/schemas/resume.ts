import { z } from 'zod';

const idSchema = z.string().trim().min(1);
const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM');

const urlSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((val) => {
    if (!val) return val;
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    return `https://${val}`;
  })
  .pipe(z.string().url())
  .nullable()
  .optional();

export const baseResumeDataSchema = z
  .object({
    version: z.literal(1).optional().default(1),
    contact: z
      .object({
        firstName: z.string().trim().min(1),
        lastName: z.string().trim().min(1),
        headline: z.string().trim().min(1).nullable().optional(),
        email: z.email(),
        phone: z.string().trim().min(1).nullable().optional(),
        location: z.string().trim().min(1).nullable().optional(),
        websiteUrl: urlSchema,
        linkedinUrl: urlSchema,
        githubUrl: urlSchema,
      })
      .strict(),
    summary: z.string().trim().min(1).nullable().optional(),
    skills: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string().trim().min(1),
            category: z.string().trim().min(1).nullable().optional(),
            level: z
              .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
              .nullable()
              .optional(),
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
            location: z.string().trim().min(1).nullable().optional(),
            startDate: yearMonthSchema,
            endDate: yearMonthSchema.nullable().optional(),
            isCurrent: z.boolean().nullable().optional(),
            tech: z.array(z.string().trim().min(1)).nullable().optional(),
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
            role: z.string().trim().min(1).nullable().optional(),
            startDate: yearMonthSchema.nullable().optional(),
            endDate: yearMonthSchema.nullable().optional(),
            isCurrent: z.boolean().nullable().optional(),
            url: urlSchema,
            repoUrl: urlSchema,
            tech: z.array(z.string().trim().min(1)).nullable().optional(),
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
            degree: z.string().trim().min(1).nullable().optional(),
            field: z.string().trim().min(1).nullable().optional(),
            location: z.string().trim().min(1).nullable().optional(),
            startDate: yearMonthSchema.nullable().optional(),
            endDate: yearMonthSchema.nullable().optional(),
            grade: z.string().trim().min(1).nullable().optional(),
            notes: z.string().trim().min(1).nullable().optional(),
          })
          .strict(),
      )
      .nullable()
      .optional(),
    certifications: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string().trim().min(1),
            issuer: z.string().trim().min(1).nullable().optional(),
            date: yearMonthSchema.nullable().optional(),
            url: urlSchema,
          })
          .strict(),
      )
      .nullable()
      .optional(),
    languages: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string().trim().min(1),
            level: z.string().trim().min(1).nullable().optional(),
          })
          .strict(),
      )
      .nullable()
      .optional(),
  })
  .strict();

export type BaseResumeData = z.infer<typeof baseResumeDataSchema>;
