import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { backendRequest } from '@/lib/api';
import type { BaseResume } from '@/lib/types/resumes';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      {
        ok: false,
        status: 401,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const result = await backendRequest<BaseResume>(`resumes/base/${id}`, {
    method: 'GET',
    auth: 'required',
    revalidate: 0,
  });

  const status = result.ok
    ? 200
    : result.status && result.status > 0
      ? result.status
      : 502;

  return NextResponse.json(result, { status });
}
