import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

export const fileUploadSchema = z.object({
  file: z // We use custom validation for the File object
    .custom<File>((val) => val instanceof File, 'Please upload a valid file')
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be less than 5MB')
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'Only .pdf, .docx, and .txt formats are supported'
    ),
});

export type FileUploadSchema = z.infer<typeof fileUploadSchema>;
