import { backendStream } from '@/lib/api';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    // Reuses all the URL building and Clerk Auth logic!
    const response = await backendStream(`onboarding/jobs/${id}/stream`, {
      method: 'GET',
      auth: 'required',
    });

    if (!response.ok || !response.body) {
      return new Response('Failed to connect to stream', {
        status: response.status,
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
    console.error('Error proxying SSE stream:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
