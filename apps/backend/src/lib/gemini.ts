import { env } from '../config/env';

export type GeminiRole = 'user' | 'model';

export type GeminiPart = { text: string };

export type GeminiContent = {
  role: GeminiRole;
  parts: GeminiPart[];
};

export type GeminiGenerateTextInput = {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  timeoutMs?: number;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: { message?: string; status?: string; code?: number };
};

export async function geminiGenerateText(
  input: GeminiGenerateTextInput,
): Promise<{ text: string; finishReason?: string }> {
  const model = input.model ?? 'gemini-3-flash-preview';
  const timeoutMs = input.timeoutMs ?? 20_000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    );
    url.searchParams.set('key', env.GEMINI_API_KEY);

    const contents: GeminiContent[] = [
      { role: 'user', parts: [{ text: input.prompt }] },
    ];

    const body = {
      ...(input.system
        ? { systemInstruction: { parts: [{ text: input.system }] } }
        : {}),
      contents,
      generationConfig: {
        ...(input.temperature !== undefined
          ? { temperature: input.temperature }
          : {}),
        ...(input.maxOutputTokens !== undefined
          ? { maxOutputTokens: input.maxOutputTokens }
          : {}),
        ...(input.topP !== undefined ? { topP: input.topP } : {}),
        ...(input.topK !== undefined ? { topK: input.topK } : {}),
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const json = (await res
      .json()
      .catch(() => null)) as GeminiGenerateContentResponse | null;

    if (!res.ok) {
      const message =
        json?.error?.message ?? (res.statusText || 'Gemini request failed');
      throw new Error(message);
    }

    const candidate = json?.candidates?.[0];
    const text =
      candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

    return { text, finishReason: candidate?.finishReason };
  } finally {
    clearTimeout(timeout);
  }
}
