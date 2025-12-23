import { ErrorCode } from 'shared';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { logger } from './logger';

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
  responseMimeType?: 'text/plain' | 'application/json';
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
  const timeoutMs = input.timeoutMs ?? 180_000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const startedAt = Date.now();
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
        ...(input.responseMimeType !== undefined
          ? { response_mime_type: input.responseMimeType }
          : {}),
      },
    };

    logger.info(
      {
        model,
        timeoutMs,
        maxOutputTokens: input.maxOutputTokens ?? null,
        temperature: input.temperature ?? null,
        responseMimeType: input.responseMimeType ?? null,
        promptChars: input.prompt.length,
        systemChars: input.system ? input.system.length : 0,
      },
      'gemini request start',
    );

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
      logger.warn(
        {
          model,
          status: res.status,
          statusText: res.statusText,
          errorStatus: json?.error?.status,
          errorCode: json?.error?.code,
          elapsedMs: Date.now() - startedAt,
        },
        'gemini request failed',
      );
      throw new AppError(message, ErrorCode.AI_GENERATION_ERROR, res.status);
    }

    const candidate = json?.candidates?.[0];
    const text =
      candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

    logger.info(
      {
        model,
        finishReason: candidate?.finishReason ?? null,
        textChars: text.length,
        elapsedMs: Date.now() - startedAt,
      },
      'gemini request success',
    );

    return { text, finishReason: candidate?.finishReason };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      logger.warn({ model, timeoutMs }, 'gemini request timeout');
      throw new AppError(
        'Gemini request timed out',
        ErrorCode.AI_TIMEOUT_ERROR,
        504,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
