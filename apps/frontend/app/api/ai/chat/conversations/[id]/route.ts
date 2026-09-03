import { NextResponse } from 'next/server';
import { getConversationDetails } from '@/lib/data/ai-chat';

/**
 * GET /api/ai/chat/conversations/[id]
 * Gets a conversation with all messages
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const result = await getConversationDetails({ id });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result, { status: 200 });
}
