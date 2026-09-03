import { streamChat } from '@/lib/data/ai-chat';

/**
 * POST /api/ai/chat
 * Proxies AI chat requests to the backend and streams the response
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await streamChat(body);

    if (!response.ok || !response.body) {
      const errorData = await response.json().catch(async () => ({
        message: await response.text().catch(() => 'Unknown error'),
      }));
      return new Response(JSON.stringify(errorData), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Error proxying AI chat stream:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
