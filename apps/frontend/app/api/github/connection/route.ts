import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getGithubConnection } from '@/lib/data/github';

export async function GET() {
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

  const result = await getGithubConnection({ params: { userId } });

  const status = result.ok
    ? 200
    : result.status && result.status > 0
      ? result.status
      : 502;

  return NextResponse.json(result, { status });
}
