import type { CreateResumeResponse } from 'shared';

import type { Prisma } from '../../prisma/generated/client/client.js';

export type CreateResumeInput = Prisma.ResumeUncheckedCreateInput & {
    idempotencyKey: string;
};

export type CreateResumeOutput = CreateResumeResponse;
