import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getResume } from '@/lib/data/resume';
import { ErrorCode } from 'shared';

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
        error: { message: 'Unauthorized', code: ErrorCode.UNAUTHORIZED },
      },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const result = await getResume({ id });

  const status = result.ok
    ? 200
    : result.status && result.status > 0
      ? result.status
      : 502;

  return NextResponse.json(result, { status });
}
