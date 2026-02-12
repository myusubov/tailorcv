import { NextResponse } from 'next/server';
import { getConversations } from '@/lib/data/ai-chat';

/**
 * GET /api/ai/chat/conversations
 * Lists all conversations for the authenticated user
 */
export async function GET() {
  const result = await getConversations();

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result, { status: 200 });
}


