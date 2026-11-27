import { z } from 'zod';

export const resumeIdParamsSchema = z.object({
  id: z.uuid(),
});
