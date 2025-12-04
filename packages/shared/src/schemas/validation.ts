import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const userProfileSchema = userSchema.extend({
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export type UserInput = z.infer<typeof userSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
